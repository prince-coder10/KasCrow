import React, { createContext } from "react";
import type { IUser } from "./provider/AuthProvider";

export type AuthContextType = {
  user: IUser | null;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  loading: boolean;
  loginWithWallet: (walletAddress: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);
