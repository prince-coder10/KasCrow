import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import useSidebar from "../../hooks/useSidebarContext";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import EscrowTimeline from "../../components/EscrowTimeline";
import { useEffect, useState } from "react";
import { kaspaSocket } from "../../sockets/kaspaSocket";
import { useParams } from "react-router-dom";
import { useEscrow } from "./resources/MyEscrows.resource";
import { useWallet } from "../../hooks/useWalletContext";
import { api } from "../../apis/axios";
import { useQueryClient } from "@tanstack/react-query";

function Escrow() {
  const { id } = useParams<{ id: string }>();
  const { navOpen } = useSidebar();
  const navigate = useNavigate();
  const [isFunding, setIsFunding] = useState(false);
  const [balance, setBalance] = useState<{
    address: string;
    balance: string;
  } | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const { wallet, connect } = useWallet();
  const queryClient = useQueryClient();

  const { data: escrow, isLoading, error } = useEscrow(id || "");

  const handleFundEscrow = async () => {
    if (!escrow || escrow.status !== "AWAITING_PAYMENT") return;
    try {
      if (!wallet.connected) {
        await connect();
        return;
      }

      if (!escrow?.escrowAddress) {
        alert("Invalid escrow address");
        return;
      }

      const kaskeeper = (window as any).Kaskeeper;

      if (!kaskeeper) {
        alert("KasKeeper not installed");
        return;
      }

      // Convert KAS to Sompi (1 KAS = 100,000,000 Sompi)
      // Use Math.round to avoid floating point errors
      const amountSompi = Math.round(
        escrow.expectedAmount * 100_000_000,
      ).toString();

      console.log(`Sending transaction to ${escrow.escrowAddress}`);
      console.log(
        `Amount: ${escrow.expectedAmount} KAS (${amountSompi} Sompi)`,
      );

      // Send transaction (KasKeeper expects positional args: address, sompi)
      // Note: The user snippet suggests sendKaspa(address, sompi)
      const tx = await kaskeeper.sendKaspa(escrow.escrowAddress, amountSompi);

      console.log("Transaction sent:", tx);

      // Update UI state to show funding progress
      setIsFunding(true);
      await queryClient.invalidateQueries({ queryKey: ["myEscrows"] });

      // Optional: show tx hash to user
      // alert(`Transaction submitted: ${tx}`);

      // DO NOT mark funded manually.
      // Your backend listener will detect UTXO and update status.
    } catch (err: any) {
      console.error("Funding failed:", err);
      // Handle user rejection specifically if possible
      if (err.message && err.message.includes("rejected")) {
        alert("Transaction rejected by user");
      } else {
        alert(`Transaction failed: ${err.message || "Unknown error"}`);
      }
      // ONLY reset if failed
      setIsFunding(false);
    }
  };

  const handleReleaseFunds = async () => {
    if (!escrow) return;
    try {
      await api.post(`/escrow/${escrow.escrowId}/release`);
      await queryClient.invalidateQueries({ queryKey: ["myEscrows"] });
      alert("Funds released successfully");
    } catch (err: any) {
      console.error("Release failed:", err);
      alert(`Release failed: ${err.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (!escrow?.escrowAddress) return;

    kaspaSocket.connect("ws://localhost:3000");
    const escrowAddress = escrow.escrowAddress;

    const unwatch = kaspaSocket.watchAddress(escrowAddress, (data) => {
      if (data && data.length > 0) {
        setBalance(data[0]);
      }
    });

    kaspaSocket.getBalance(escrowAddress).then((data) => {
      console.log("Full data from socket:", data); // Should now show [{address, balance}]

      if (data && Array.isArray(data) && data.length > 0) {
        // data[0] is { address: "...", balance: "0" }
        setBalance(data[0]);
      } else {
        console.warn("No balance entries found for this address");
      }
    });

    // WRAP IN BRACES: This ensures the return type is void, not boolean
    return () => {
      unwatch();
    };
  }, [escrow?.escrowAddress]);

  const roundBalance = (balance: string): string => {
    if (!balance) return "0.00";

    // 1. Remove commas and parse to a float
    const numericValue = parseFloat(balance.replace(/,/g, ""));

    // 2. Handle cases where the string isn't a valid number
    if (isNaN(numericValue)) return "0.00";

    // 3. Round to 2 DP and add commas back using Intl.NumberFormat
    return numericValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const viewSettlement = async () => {
    if (!escrow) return;
    await queryClient.invalidateQueries({ queryKey: ["myEscrows"] });

    const url = `/escrow/settlement/${escrow.escrowId}/view`;
    const features =
      "width=400,height=600,resizable=yes,scrollbars=yes,status=no,location=no";
    window.open(url, "SettlementView", features);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-10">
        Loading Escrow Details...
      </div>
    );
  }

  if (error || !escrow) {
    return (
      <div className="w-full h-full flex items-center justify-center text-red-500 p-10">
        Error loading escrow details.
      </div>
    );
  }

  const isBuyer = wallet.address === escrow.buyerAddress;
  // const isVendor = wallet.address === escrow.vendorAddress;

  const statusClass = `${escrow.status === "RELEASED" ? "text-success bg-success/10" : escrow.status === "CREATED" ? "text-primary  bg-primary/10" : "text-warning bg-warning/10"}`;

  return (
    <>
      <div
        className={`w-full max-w-full flex flex-col gap-5 overflow-x-hidden ${navOpen ? "md:ml-69 ml-10" : "ml-4 max-[480px]:mt-10 min-[480px]:ml-15"} mb-10 pt-3 pr-4 transition-all duration-300`}
      >
        <div className="flex items-center gap-5">
          <ArrowLeft
            className="cursor-pointer"
            onClick={() => navigate("/escrows")}
          />
          <div>
            <p className="text-xl font-bold flex gap-3">
              {escrow.title}{" "}
              <span
                className={` ${statusClass} h-fit text-[10px] flex items-center p-2 rounded-sm font-normal`}
              >
                {escrow.status}
              </span>
            </p>
            <p className="text-sm text-muted/50">
              ID: {escrow.escrowId} • Created 2 mins ago
            </p>
          </div>
        </div>
        <div className="mt-10 rounded-xl border border-gray-800 transition-all duration-300 bg-card hover:border-[#22D3EE]/30 p-8 border-t-4 border-t-primary relative overflow-hidden">
          <div className="flex justify-between items-center">
            <div className="w-full">
              <p className="text-[12px] text-muted/80">Escrow Balance</p>
              <p className="text-3xl font-bold ml-2">
                {roundBalance(balance?.balance ?? "") ?? 0.0}{" "}
                <span className="text-sm text-muted/60">KAS</span>
              </p>
            </div>
            <div className="w-full flex flex-col justify-start">
              {escrow.status !== "FUNDED" && (
                <div>
                  <p className="text-[12px] text-muted/80 text-right">
                    Amount to Fund
                  </p>
                  <p className="text-3xl font-bold text-right mr-2">
                    {escrow.expectedAmount}
                    <span className="text-sm text-muted/60">KAS</span>
                  </p>
                </div>
              )}
              {escrow.status === "FUNDED" && (
                <p className="text-primary font-semibold text-right mt-4">
                  Fully funded
                </p>
              )}
            </div>
          </div>
          {/* fund */}
          {/* fund */}
          <div className="pt-8">
            {(() => {
              const FUNDING_ALLOWED_STATUSES = [
                "AWAITING_PAYMENT",
                "PARTIALLY_FUNDED",
              ];
              const FUNDED_OR_BEYOND_STATUSES = [
                "FUNDED",
                "AWAITING_RELEASE",
                "RELEASED",
              ];

              const showFundButton =
                !isFunding &&
                isBuyer &&
                FUNDING_ALLOWED_STATUSES.includes(escrow.status);

              const showSettlement =
                !isFunding &&
                isBuyer &&
                FUNDED_OR_BEYOND_STATUSES.includes(escrow.status);

              const isSettlementViewEnabled = escrow.status === "FUNDED";

              return (
                <>
                  {showFundButton && (
                    <Button onClick={handleFundEscrow} disabled={false}>
                      Fund Escrow
                    </Button>
                  )}

                  {showSettlement && (
                    <div>
                      <div className="bg-muted/40 w-full h-4 rounded-2xl overflow-hidden">
                        <div
                          className="h-4 rounded-2xl primary-gradient funding-bar"
                          onAnimationEnd={() => {
                            // setIsFunding(false);
                          }}
                          style={{
                            animationDuration: "500ms",
                          }}
                        />
                      </div>
                      <p className="text-[10px] mt-3">
                        It took{" "}
                        <span className="bg-primary/10 text-primary">
                          500ms
                        </span>{" "}
                        to receive and confirm transaction
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => viewSettlement()}
                        disabled={!isSettlementViewEnabled}
                      >
                        View Settlement{" "}
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
        {/* Actions */}
        <div className="rounded-xl border border-gray-800 transition-all duration-300 bg-card hover:border-[#22D3EE]/30 p-4 relative overflow-hidden">
          <p className="sm font-bold text-white">Actions</p>
          <div className="w-full flex flex-col justify-evenly gap-4 py-4">
            <div className="w-full flex md:flex-row flex-col justify-evenly gap-4 ">
              <Button
                className="w-full"
                disabled={escrow.status !== "AWAITING_RELEASE"}
                onClick={() => handleReleaseFunds()}
              >
                <CheckCircle2 />
                Release Funds
              </Button>
              <Button
                className="w-full"
                danger={true}
                disabled={escrow.status == "RELEASED"}
              >
                <AlertTriangle />
                Raise Dispute
              </Button>
            </div>
            <p className="text-[10px] text-muted/60">
              Both parties must agree to release funds. Disputes are handled by
              KAS-DAO arbiters.
            </p>
          </div>
        </div>
        {/* Timeline */}
        <EscrowTimeline escrow={escrow} />
      </div>
    </>
  );
}

export default Escrow;
