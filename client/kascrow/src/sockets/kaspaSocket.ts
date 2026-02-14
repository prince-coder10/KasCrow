// kaspaSocket.ts

// kaspaSocket.ts
type BalanceCallback = (data: any) => void;

class KaspaSocket {
  private socket: WebSocket | null = null;
  private messageQueue: string[] = [];
  private pendingRequests = new Map<
    string,
    { resolve: Function; reject: Function }
  >();
  private balanceListeners = new Map<string, Set<BalanceCallback>>();

  connect(url: string = "ws://localhost:3000") {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.CONNECTING ||
        this.socket.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log("🚀 Connected to Kascrow Socket");

      // Use a small interval or a check to flush the queue
      const flush = () => {
        if (this.socket?.readyState === WebSocket.OPEN) {
          while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            if (msg) this.socket.send(msg);
          }
        }
      };

      flush();
    };
    this.socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.requestId && this.pendingRequests.has(msg.requestId)) {
        const { resolve } = this.pendingRequests.get(msg.requestId)!;
        // msg.data is now the 'entries' array [ {address, balance} ]
        resolve(msg.data);
        this.pendingRequests.delete(msg.requestId);
      }

      if (msg.type === "balance-update") {
        const listeners = this.balanceListeners.get(msg.address);
        // If the real-time push also uses the 'entries' format,
        // extract it here or in the callback.
        const updateData = msg.data?.entries || msg.data;
        listeners?.forEach((callback) => callback(updateData));
      }
    };
  }

  private safeSend(message: any) {
    const json = JSON.stringify(message);
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(json);
    } else {
      this.messageQueue.push(json);
    }
  }

  async getBalance(address: string): Promise<any> {
    const requestId = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      this.safeSend({ type: "get-balance", requestId, payload: { address } });
    });
  }

  watchAddress(address: string, callback: BalanceCallback) {
    if (!this.balanceListeners.has(address)) {
      this.balanceListeners.set(address, new Set());
      this.safeSend({ type: "watch-address", payload: { address } });
    }
    this.balanceListeners.get(address)?.add(callback);
    return () => this.balanceListeners.get(address)?.delete(callback);
  }
}

export const kaspaSocket = new KaspaSocket();
