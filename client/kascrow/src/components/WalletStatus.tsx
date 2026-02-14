import { Copy, X, Store, AlertTriangle } from "lucide-react";
import { useWallet } from "../hooks/useWalletContext";
import { useQueryClient } from "@tanstack/react-query";
import kaskeeper from "../assets/kaskeeper.png";
import { useState } from "react";

function WalletStatus() {
  const { wallet, connect } = useWallet();
  const [showPopup, setShowPopup] = useState(false);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const queryClient = useQueryClient();

  const connectWallet = async () => {
    try {
      await connect();
      setShowPopup(false);
      await queryClient.invalidateQueries({ queryKey: ["myEscrows"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      await queryClient.invalidateQueries({ queryKey: ["settlements"] });
    } catch (error: any) {
      console.error("Connection failed:", error);
      if (error?.message === "KasKeeper wallet not installed") {
        setShowPopup(false);
        setShowInstallPopup(true);
      }
    }
  };

  const handleConnectClick = () => {
    setShowPopup(true);
  };

  return (
    <>
      {/* Installation Popup */}
      {showInstallPopup && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowInstallPopup(false)}
        >
          <div
            className="bg-card border border-warning/30 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowInstallPopup(false)}
              className="absolute top-4 right-4 text-muted hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>

              <h3 className="text-xl font-bold mb-2">Wallet Not Found</h3>
              <p className="text-sm text-muted mb-6">
                KasKeeper is required to use KasCrow. Please install the
                extension to continue.
              </p>

              <a
                href="https://chromewebstore.google.com/detail/bicbpicnddlclhekbmgafcbkemdikdem?utm_source=item-share-cb"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-primary hover:bg-primary/90 text-black font-semibold transition-all mb-3"
              >
                <Store size={18} />
                Install KasKeeper
              </a>

              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="text-xs text-muted hover:text-primary transition-colors"
              >
                I've installed it, reload page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Popup */}
      {showPopup && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPopup(false)}
        >
          {/* Popup Modal */}
          <div
            className="bg-card border border-gray-800 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-muted hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6 text-center">
              Connect Wallet
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={connectWallet}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-bg-base hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <span className="font-medium group-hover:text-primary transition-colors">
                  KasKeeper
                </span>
                <img
                  src={kaskeeper}
                  alt="KasKeeper"
                  className="w-10 h-10 object-contain"
                />
              </button>
            </div>
            <p className="text-center text-xs text-muted mt-6">
              More wallets coming soon.
            </p>
          </div>
        </div>
      )}

      {!wallet.ready ? (
        <div className="p-4 rounded-xl flex justify-center items-center bg-card border border-gray-800 mt-10 mx-5">
          <p className="text-[12px] text-muted-foreground">Checking wallet…</p>
        </div>
      ) : wallet.connected ? (
        <div
          className="p-4 rounded-xl bg-card border border-gray-800 group hover:border-gray-700 transition-colors mt-10 mx-5"
          // onClick={disconnect}
        >
          <div className="flex items-center gap-3">
            <div className="size-2 bg-green-500 rounded-full" />
            <p className="text-[12px]">
              {wallet.network === "kaspa_testnet"
                ? "Kaspa Testnet"
                : "Kaspa Mainnet"}
            </p>
          </div>

          <p
            className="mt-3 flex gap-2 text-[12px] w-fit p-0.5 px-1 text-success bg-success/10 items-center cursor-pointer"
            onClick={() => {
              navigator.clipboard.writeText(wallet.address!);
            }}
          >
            {wallet.address?.slice(0, 6)}…{wallet.address?.slice(-4)}
            <Copy size={15} className="text-success" />
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-xl flex justify-center items-center bg-card border border-gray-800 hover:border-gray-700 transition-colors mt-10 mx-5">
          <button
            className="bg-primary/10 text-primary p-2 px-4 rounded-lg text-[12px] cursor-pointer hover:bg-primary/20 transition-colors font-medium"
            onClick={handleConnectClick}
          >
            Connect Wallet
          </button>
        </div>
      )}
    </>
  );
}

export default WalletStatus;
