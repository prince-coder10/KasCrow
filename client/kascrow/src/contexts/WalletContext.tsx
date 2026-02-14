import { createContext } from "react";
import type { IWallet } from "./provider/WalletProvider";

export type WalletContextType = {
  wallet: IWallet;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

export const WalletContext = createContext<WalletContextType | null>(null);
