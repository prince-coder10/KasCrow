import { WalletContext } from "../contexts/WalletContext";
import { useContext } from "react";

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return ctx;
};
