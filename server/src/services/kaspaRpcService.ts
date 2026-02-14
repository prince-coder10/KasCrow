import kaspa, {
  Resolver,
  RpcClient,
  type RpcEventMap,
} from "@kluster/kaspa-wasm-node";
import * as WebSocket from "ws";

type KaspaRpcEventListener = (event: any) => void;

class KaspaRpcService {
  private rpc: RpcClient | null = null;
  private isConnected: boolean = false;
  private subscribers: Map<string, Set<WebSocket.WebSocket>> = new Map();
  private rpcEventListeners: Map<string, KaspaRpcEventListener> = new Map();
  private addressSubscribers: Map<string, Set<WebSocket.WebSocket>> = new Map();

  constructor() {
    kaspa.initConsolePanicHook();
  }

  public getCurrentURL() {
    return this.rpc?.url;
  }

  public async connect() {
    if (this.isConnected) {
      console.log("Kaspa RPC Client already connected.");
      return;
    }

    this.rpc = new RpcClient({
      // hint: you can change to a node url of yours
      // url: "ws://<url>",
      resolver: new Resolver(),
      networkId: "testnet-10", //"mainnet"
    });

    try {
      await this.rpc.connect({
        timeoutDuration: 2000,
        blockAsyncConnect: true,
      });
      this.isConnected = true;
      console.log("Kaspa RPC Client Connected.");
    } catch (error) {
      console.error("Failed to connect to Kaspa RPC client:", error);
      this.isConnected = false;
      throw error;
    }
  }

  public getRpcClient(): RpcClient {
    if (!this.rpc || !this.isConnected) {
      throw new Error("Kaspa RPC Client is not connected.");
    }
    return this.rpc;
  }

  public isRpcConnected(): boolean {
    return this.isConnected;
  }

  public async getBlockDagInfo() {
    const rpc = this.getRpcClient();
    return rpc.getBlockDagInfo();
  }

  public async getBalancesByAddresses(addresses: string[]) {
    const rpc = this.getRpcClient();
    return rpc.getBalancesByAddresses({ addresses });
  }

  private broadcast(eventName: string, data: any) {
    const clients = this.subscribers.get(eventName);
    if (clients) {
      clients.forEach((ws) => {
        if (ws.readyState === WebSocket.WebSocket.OPEN) {
          ws.send(JSON.stringify({ event: eventName, data }));
        }
      });
    }
  }

  public async initGlobalUtxoListener() {
    const rpc = this.getRpcClient();

    rpc.addEventListener("utxos-changed", async (event: any) => {
      const affectedAddresses = new Set<string>();

      // Ensure we handle addresses as strings (some SDK versions return Address objects)
      event.data.added?.forEach((u: any) => {
        const addr =
          typeof u.address === "string" ? u.address : u.address.toString();
        affectedAddresses.add(addr);
      });

      event.data.removed?.forEach((u: any) => {
        const addr =
          typeof u.address === "string" ? u.address : u.address.toString();
        affectedAddresses.add(addr);
      });

      for (const address of affectedAddresses) {
        const clients = this.addressSubscribers.get(address);
        if (clients && clients.size > 0) {
          try {
            const balanceData = await this.getBalancesByAddresses([address]);

            const payload = JSON.stringify({
              type: "balance-update",
              address: address,
              data: balanceData,
            });

            clients.forEach((ws) => {
              // FIX: Use WebSocket.WebSocket.OPEN to match your import style
              if (ws.readyState === WebSocket.WebSocket.OPEN) {
                ws.send(payload);
              }
            });
          } catch (err) {
            console.error(
              `❌ Failed to push balance update for ${address}:`,
              err,
            );
          }
        }
      }
    });
  }
  /**
   * Call this when a client specifically wants to "watch" an address for balance changes
   */
  public async watchAddress(address: string, ws: WebSocket.WebSocket) {
    if (!this.addressSubscribers.has(address)) {
      this.addressSubscribers.set(address, new Set());

      // Tell Kaspa RPC to start monitoring this address
      // The Wasm SDK expects an object with an addresses array
      await this.getRpcClient().subscribeUtxosChanged([address]);
    }

    this.addressSubscribers.get(address)?.add(ws);
  }

  public unwatchAddress(address: string, ws: WebSocket.WebSocket) {
    const clients = this.addressSubscribers.get(address);
    if (clients) {
      clients.delete(ws);
      // Optional: if (clients.size === 0) unsubscribe from RPC to save bandwidth
    }
  }

  /**
   * Removes a WebSocket client from all address subscriptions.
   * Called when a user disconnects or leaves the escrow page.
   */
  public unwatchAll(ws: WebSocket.WebSocket) {
    let count = 0;

    this.addressSubscribers.forEach((clients, address) => {
      if (clients.has(ws)) {
        clients.delete(ws);
        count++;

        // Optimization: If no one is watching this address anymore,
        // remove the entry from the map.
        if (clients.size === 0) {
          this.addressSubscribers.delete(address);
          // Optional: Call rpc.unsubscribeUtxosChanged([address])
          // if you want to be extremely aggressive with RPC efficiency.
        }
      }
    });

    if (count > 0) {
      console.log(
        `🧹 Cleaned up ${count} address subscriptions for disconnected client.`,
      );
    }
  }

  public subscribe(eventName: keyof RpcEventMap, ws: WebSocket.WebSocket) {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, new Set());
      this.setupRpcEventListener(eventName);
    }
    this.subscribers.get(eventName)?.add(ws);
    console.log(
      `WebSocket subscribed to ${eventName}. Total subscribers: ${this.subscribers.get(eventName)?.size}`,
    );
  }

  public unsubscribe(eventName: string, ws: WebSocket.WebSocket) {
    const clients = this.subscribers.get(eventName);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        this.subscribers.delete(eventName);
        this.removeRpcEventListener(eventName);
      }
    }
    console.log(
      `WebSocket unsubscribed from ${eventName}. Remaining subscribers: ${this.subscribers.get(eventName)?.size || 0}`,
    );
  }

  private setupRpcEventListener(eventName: keyof RpcEventMap) {
    if (!this.rpcEventListeners.has(eventName)) {
      const listener: KaspaRpcEventListener = (event: any) => {
        this.broadcast(eventName, event.data);
      };
      this.rpcEventListeners.set(eventName, listener);
      this.getRpcClient().addEventListener(eventName, listener);
      console.log(`Kaspa RPC client event listener added for ${eventName}`);

      // Call the corresponding subscribe method on the RPC client
      this.activateRpcSubscription(eventName);
    }
  }

  private removeRpcEventListener(eventName: string) {
    const listener = this.rpcEventListeners.get(eventName);
    if (listener) {
      this.getRpcClient().removeEventListener(eventName, listener);
      this.rpcEventListeners.delete(eventName);
      console.log(`Kaspa RPC client event listener removed for ${eventName}`);
    }
  }

  private async activateRpcSubscription(eventName: string) {
    try {
      switch (eventName) {
        case "block-added":
          await this.getRpcClient().subscribeBlockAdded();
          break;
        case "virtual-daa-score-changed":
          await this.getRpcClient().subscribeVirtualDaaScoreChanged();
          break;
        case "virtual-chain-changed":
          await this.getRpcClient().subscribeVirtualChainChanged(true);
          break;
        // Add other RPC subscription cases here
        default:
          console.warn(
            `Attempted to activate unknown RPC subscription: ${eventName}`,
          );
      }
      console.log(`Activated RPC subscription for ${eventName}`);
    } catch (error) {
      console.error(
        `Error activating RPC subscription for ${eventName}:`,
        error,
      );
    }
  }
}

export const kaspaRpcService = new KaspaRpcService();
