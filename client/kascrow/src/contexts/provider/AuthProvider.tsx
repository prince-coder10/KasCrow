import { useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "../AuthContext";
import { api } from "../../apis/axios";

export interface IUser {
  walletAddress: string;
  userId: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Restore session on app load
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const res = await api.get("/auth/profile");
      setUser({
        walletAddress: res.data.data.wallet,
        userId: res.data.data.id,
      });

      // 🚀 preload dashboard
      //    dashboardResource.preload();
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithWallet = async (walletAddress: string) => {
    setLoading(true);

    try {
      const res = await api.post("/auth/wallet", {
        walletAddress,
      });

      setUser({
        walletAddress: res.data.data.wallet,
        userId: res.data.data.id,
      });

      // 🚀 preload dashboard instantly
      //    dashboardResource.preload();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        loginWithWallet,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
