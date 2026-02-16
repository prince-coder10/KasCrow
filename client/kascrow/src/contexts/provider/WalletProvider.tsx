import { useEffect, useState, useRef } from "react";
import {
  connectKasKeeper,
  disconnectKasKeeper,
} from "../../wallet/connetWallet";
import { WalletContext } from "../WalletContext";
import { useAuth } from "../../hooks/useAuth";

export interface IWallet {
  address: string | null;
  connected: boolean;
  network: string | null;
  ready: boolean;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const initialWallet: IWallet = {
    address: null,
    connected: false,
    network: null,
    ready: false,
  };

  const [wallet, setWallet] = useState<IWallet>(initialWallet);
  const walletRef = useRef(wallet);
  const { loginWithWallet, logout } = useAuth();

  // Keep ref up to date for polling
  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  const connect = async () => {
    const { address, network } = await connectKasKeeper();

    setWallet({
      address,
      connected: true,
      network,
      ready: true,
    });

    // Auto-login after wallet connection
    if (address) {
      await loginWithWallet(address);
    }
  };

  const disconnect = async () => {
    // Logout before disconnecting wallet
    await logout();
    await disconnectKasKeeper();
    setWallet(initialWallet);
    window.location.reload();
    console.log(wallet);
  };

  // Auto-sync on reload
  useEffect(() => {
    // 1️⃣ Check if KasKeeper is available
    const kaskeeper = (window as any)?.Kaskeeper;

    if (!kaskeeper) {
      // If no wallet extension, just stop loading so UI can show "Connect Wallet" (which might prompt install)
      setWallet((w) => ({ ...w, ready: true }));
      return;
    }

    // 2️⃣ Check synchronously if we already know the selected address (KasKeeper populates this if trusted)
    if (kaskeeper._selectedAddress) {
      setWallet({
        address: kaskeeper._selectedAddress,
        connected: true,
        network: kaskeeper._network,
        ready: true,
      });
      // ✅ DON'T call loginWithWallet here - AuthProvider handles session restoration via /auth/profile
    } else {
      // No previous connection found synchronously, but we still need to check async
      // Don't set ready: true yet, wait for getAccounts
    }

    // 3️⃣ Check asynchronously for trusted accounts
    // 🔥 IMPORTANT: ask for accounts silently
    kaskeeper
      .getAccounts?.()
      .then((accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setWallet({
            address: accounts[0],
            connected: true,
            network: kaskeeper._network,
            ready: true,
          });
          // ✅ DON'T call loginWithWallet here - AuthProvider handles session restoration via /auth/profile
        } else {
          // No accounts trusted -> Ready but not connected
          setWallet({
            address: null,
            connected: false,
            network: kaskeeper._network,
            ready: true,
          });
        }
      })
      .catch((err: any) => {
        console.error("Failed to get accounts", err);
        // Even if it fails, we must set ready: true so the UI doesn't stick on loading
        setWallet((w) => ({ ...w, ready: true }));
      });

    // 4️⃣ Listen for changes
    // Only set up listeners if kaskeeper exists
    // Debug logging to understand what we're working with
    console.log(
      "KasKeeper Debug: Initializing listeners. Wallet object:",
      kaskeeper,
    );

    const handleAccountsChanged = async (accounts: string[] | any) => {
      console.log("KasKeeper Debug: accountsChanged event fired", accounts);

      let newAddress: string | null = null;

      // Handle different potential payload formats
      if (Array.isArray(accounts)) {
        newAddress = accounts.length > 0 ? accounts[0] : null;
      } else if (typeof accounts === "string") {
        newAddress = accounts;
      } else if (accounts && typeof accounts === "object") {
        // Some wallets emit an object with an accounts property
        newAddress =
          accounts.address ||
          (Array.isArray(accounts.accounts) ? accounts.accounts[0] : null);
      }

      const currentAddress = walletRef.current.address;
      console.log(
        `KasKeeper Debug: Address Change Detection - Current: ${currentAddress}, New: ${newAddress}`,
      );

      // Handle Disconnect (newAddress is null or empty)
      if (!newAddress) {
        console.log("KasKeeper Debug: Wallet disconnected");
        await logout();
        setWallet(initialWallet);
        return;
      }

      // Handle Change
      if (currentAddress && currentAddress !== newAddress) {
        console.log(
          "KasKeeper Debug: Usage Address changed - Logging out old session",
        );
        await logout();
        // We don't auto-login again here to be safe, user should manually reconnect or we let the effect sync it up
        setWallet(initialWallet);
      } else if (!currentAddress && newAddress) {
        // New connection (e.g. from external unlock)
        console.log("KasKeeper Debug: external connection detected");
      }
    };

    const handleNetworkChanged = (network: string | any) => {
      console.log("KasKeeper Debug: networkChanged event fired", network);
      // Force string conversion just in case
      const networkId =
        typeof network === "object"
          ? network?.networkId || JSON.stringify(network)
          : String(network);

      setWallet((w) => {
        console.log("KasKeeper Debug: Updating wallet network to", networkId);
        return { ...w, network: networkId };
      });
    };

    // Attempt to bind listeners
    // Some basic implementations might use 'on', others 'addListener'
    if (kaskeeper.on) {
      kaskeeper.on("accountsChanged", handleAccountsChanged);
      kaskeeper.on("networkChanged", handleNetworkChanged);
    }

    // 5️⃣ Polling Fallback (Vital for when events fail)
    const pollInterval = setInterval(async () => {
      const currentKaskeeper = (window as any)?.Kaskeeper;
      if (currentKaskeeper && currentKaskeeper._selectedAddress) {
        const polledAddress = currentKaskeeper._selectedAddress;
        const polledNetwork = currentKaskeeper._network;

        setWallet((prev) => {
          // Only update if something changed to avoid unnecessary renders
          if (
            prev.address !== polledAddress ||
            prev.network !== polledNetwork
          ) {
            console.log(
              "KasKeeper Debug: Polling detected drift - syncing state",
              {
                oldAddr: prev.address,
                newAddr: polledAddress,
                oldNet: prev.network,
                newNet: polledNetwork,
              },
            );

            return {
              ...prev,
              address: polledAddress,
              network: polledNetwork,
              connected: !!polledAddress,
              ready: true,
            };
          }
          return prev;
        });

        // Check if we need to logout due to address change seen via polling
        // Access fresh state via Ref
        const currentWallet = walletRef.current;
        if (
          currentWallet.address &&
          polledAddress &&
          currentWallet.address !== polledAddress
        ) {
          console.log(
            "KasKeeper Debug: Polling found address mismatch, logging out",
          );
          await logout();
          setWallet(initialWallet);
        }
      }
    }, 2000); // Check every 2 seconds

    // Cleanup listeners on unmount
    return () => {
      clearInterval(pollInterval);

      // Try to remove listeners if possible (assuming 'off' or similar exists, but standard is limited for Kaskeeper)
      if (kaskeeper.off) {
        // kaskeeper.off("accountsChanged", handleAccountsChanged);
        // kaskeeper.off("networkChanged", handleNetworkChanged);
      }
      // Note: Without explicit 'off', we rely on garbage collection if the wallet extension handles it,
      // or just accept listeners might hang around in the window object (common in extensions).
    };
  }, [loginWithWallet, logout]);

  // context

  return (
    <WalletContext.Provider value={{ wallet, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}
