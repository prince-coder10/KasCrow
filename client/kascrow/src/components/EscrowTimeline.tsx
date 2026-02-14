import { CheckCircle2 } from "lucide-react";
import { type IEscrow } from "../pages/app/resources/MyEscrows.resource";

interface Props {
  escrow: IEscrow;
}

function EscrowTimeline({ escrow }: Props) {
  const formatTime = (date?: Date | string) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const steps = [
    {
      label: "Contract Created",
      time: escrow.createdAt,
      isActive: true, // Always active if escrow exists
    },
    {
      label: "Vendor Accepts Escrow",
      time: escrow.vendorAcknowledgedAt,
      isActive: escrow.status !== "CREATED",
    },
    {
      label: "Buyer Deposited Funds",
      time: escrow.fundedAt,
      isActive: ["FUNDED", "AWAITING_RELEASE", "RELEASED"].includes(
        escrow.status,
      ),
    },
    {
      label: "Funds Secured",
      time: escrow.fundedAt, // Same as deposited
      isActive: ["FUNDED", "AWAITING_RELEASE", "RELEASED"].includes(
        escrow.status,
      ),
    },
    {
      label: "Vendor Delivery",
      time: escrow.buyerReleasedAt, // Using buyerReleasedAt per user request, effectively "Release Triggered"
      isActive: ["AWAITING_RELEASE", "RELEASED"].includes(escrow.status),
    },
    {
      label: "Released",
      time: escrow.releasedAt,
      isActive: escrow.status === "RELEASED",
    },
  ];

  return (
    <div className="rounded-xl border border-gray-800 transition-all duration-300 bg-card hover:border-[#22D3EE]/30 p-4 relative overflow-hidden">
      <p className="sm font-bold text-white">Escrow Timeline</p>
      <div className="flex flex-col gap-5">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isNextActive = !isLast && steps[index + 1].isActive;

          return (
            <div
              key={index}
              className={`flex w-full ${!isLast ? (isNextActive ? "gap-4 items-center justify-start checked-after" : "mb-5 gap-4 items-center justify-start") : "gap-4 items-center justify-start"}`}
            >
              <div
                className={`ring-3 p-1.5 rounded-full flex justify-center ${
                  step.isActive ? "ring-primary" : "ring-muted/50"
                }`}
              >
                <CheckCircle2
                  size={20}
                  className={`font-light ${
                    step.isActive
                      ? "text-primary fill-primary"
                      : "text-muted/50 fill-muted/50"
                  }`}
                />
              </div>
              <div className="mt-2">
                <p
                  className={`font-normal ${step.isActive ? "" : "text-muted"}`}
                >
                  {step.label}
                </p>
                {step.isActive && step.time && (
                  <p className="text-[10px] text-muted/50">
                    {formatTime(step.time)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EscrowTimeline;
