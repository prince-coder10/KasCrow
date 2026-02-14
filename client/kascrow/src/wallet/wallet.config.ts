export type WalletState = {
  address: string | null;
  connected: boolean;
  network: "kaspa_mainnet" | "kaspa_testnet" | null;
};
