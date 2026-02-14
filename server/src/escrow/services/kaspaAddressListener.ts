import { kaspaRpcService } from "../../services/kaspaRpcService.js";

class KaspaAddressListener {
  private rpc: any | null = null;
  private subscribedAddresses = new Set<string>();
  private isSubscribed = false;

  private getRpc() {
    if (!this.rpc) {
      this.rpc = kaspaRpcService.getRpcClient();
    }
    return this.rpc;
  }

  async init(initialAddresses: string[]) {
    initialAddresses.forEach((a) => this.subscribedAddresses.add(a));
    await this.resubscribe();
  }

  async addAddress(address: string) {
    if (!address || this.subscribedAddresses.has(address)) return;

    this.subscribedAddresses.add(address);
    await this.resubscribe();
  }

  async addAddresses(addresses: string[]) {
    let changed = false;
    for (const addr of addresses) {
      if (addr && !this.subscribedAddresses.has(addr)) {
        this.subscribedAddresses.add(addr);
        changed = true;
      }
    }

    if (changed) await this.resubscribe();
  }

  private async resubscribe() {
    // sanitize addresses
    const addresses = Array.from(this.subscribedAddresses)
      .map((a) => String(a).trim())
      .filter((a) => a.length > 0);

    if (addresses.length === 0) {
      console.warn("⚠️ No valid addresses to subscribe");
      return;
    }

    console.log("📡 Subscribing to addresses:", addresses);

    const rpc = this.getRpc();

    // unsubscribe first if already subscribed
    if (this.isSubscribed) {
      try {
        await rpc.unsubscribeUtxosChanged();
      } catch (err) {
        console.warn("⚠️ Failed to unsubscribe before resubscribe:", err);
      }
    }

    // subscribe
    try {
      await rpc.subscribeUtxosChanged(addresses); // ⚠️ MUST wrap in object
      this.isSubscribed = true;
      console.log("✅ Subscribed successfully:", addresses.length);
    } catch (err) {
      console.error("❌ Failed to subscribe addresses:", err, addresses);
    }
  }
}

export const kaspaAddressListener = new KaspaAddressListener();
