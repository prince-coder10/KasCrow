import { kaspaRpcService } from "../services/kaspaRpcService.js";
import { kaspaAddressListener } from "./services/kaspaAddressListener.js";
import EscrowService from "./services/escrow.service.js";
import EscrowStore from "./escrow.store.js";
import { Subscription } from "./model/Subscription.js";
import type { IEscrowUTXO } from "./model/Escrow.js";
import { SettlementService } from "../settlement/settlement.service.js";
import { SettlementStore } from "../settlement/settlement.store.js";
import { FileStorageService } from "../settlement/files/fileStore.service.js";

const Settlement = new SettlementService(
  new SettlementStore(),
  new FileStorageService(),
);
const Escrow = new EscrowService(new EscrowStore(), Settlement);

let listenersAttached = false;

export async function startEscrowListener() {
  console.log("🟢 Escrow listener starting...");

  // 1️⃣ Ensure RPC is connected
  try {
    await kaspaRpcService.connect();
  } catch (err) {
    console.error("❌ Failed to connect Kaspa RPC:", err);
    return;
  }

  const rpc = kaspaRpcService.getRpcClient();

  // 2️⃣ Load persisted addresses
  const subscription = await Subscription.findOne({});
  const addresses = (subscription?.addresses ?? [])
    .map((a) => String(a).trim())
    .filter((a) => a.length > 0);

  console.log("📡 Initial sanitized addresses:", addresses);

  if (addresses.length > 0) {
    try {
      await kaspaAddressListener.init(addresses);
    } catch (err) {
      console.error("❌ Failed to subscribe to initial addresses:", err);
    }
  } else {
    console.warn("⚠️ No escrow addresses to subscribe yet");
  }

  // 3️⃣ Attach listeners ONCE
  if (!listenersAttached) {
    listenersAttached = true;

    // 🔔 UTXO listener
    rpc.addEventListener("utxos-changed", async (event: any) => {
      try {
        const added = event?.data?.added ?? [];
        if (!added.length) return;

        const utxosByAddress = new Map<string, IEscrowUTXO[]>();

        for (const u of added) {
          const address = u.address?.toString();
          if (!address) continue;

          const utxo: IEscrowUTXO = {
            txId: u.outpoint.transactionId,
            index: u.outpoint.index,
            amount: Number(u.amount),
            address,
            confirmations: 0,
            refunded: false,
          };

          if (!utxosByAddress.has(address)) utxosByAddress.set(address, []);
          utxosByAddress.get(address)!.push(utxo);
        }

        for (const [address, utxos] of utxosByAddress.entries()) {
          const escrow = await Escrow.getEscrowByAddress(address);
          if (!escrow) continue;

          await Escrow.applyFundingUpdate(escrow, utxos);
        }
      } catch (err) {
        console.error("❌ utxos-changed handling failed:", err);
      }
    });

    // 🔗 Virtual chain listener
    try {
      await rpc.subscribeVirtualChainChanged(true);

      rpc.addEventListener("virtual-chain-changed", async () => {
        try {
          // Optional: confirmations / reorg safety
        } catch (err) {
          console.error("❌ virtual-chain handler failed:", err);
        }
      });
    } catch (err) {
      console.error("❌ Failed to subscribe virtual chain:", err);
    }
  }

  console.log("🟢 Escrow listener fully active");
}
