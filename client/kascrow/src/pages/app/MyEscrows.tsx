// import { Suspense } from "react";
import useSidebar from "../../hooks/useSidebarContext";
import {
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
import { useMyEscrows } from "./resources/MyEscrows.resource"; // Update this path
import type { IEscrow } from "./resources/MyEscrows.resource";
import { useNavigate } from "react-router-dom";
import MyEscrowsLayout from "../../components/layouts/MyEscrowsLayout";

// Helper to map backend status to UI styles and icons
const getStatusConfig = (status: string) => {
  switch (status) {
    case "RELEASED":
      return { color: "text-success", bg: "bg-success/40", icon: CheckCircle };
    case "CREATED":
    case "AWAITING_PAYMENT":
    case "EXPIRED":
      return { color: "text-warning", bg: "bg-warning/40", icon: Clock };
    case "FUNDED":
    case "AWAITING_RELEASE":
      return { color: "text-primary", bg: "bg-primary/40", icon: PlayCircle };
    case "DISPUTED":
      return { color: "text-red-500", bg: "bg-red-500/40", icon: AlertCircle };
    default:
      return { color: "text-muted", bg: "bg-gray-800", icon: Clock };
  }
};

function EscrowList() {
  const { data: escrows, isLoading, error } = useMyEscrows();

  const navigate = useNavigate();

  if (isLoading) {
    return <MyEscrowsLayout />;
  }

  if (error || !escrows) {
    return <div className="text-red-500">Error loading escrows</div>;
  }

  // Only show the most recent 5 for a "Recent" section (as per original comment, though logic wasn't there)

  return (
    <>
      {escrows.map((escrow: IEscrow) => {
        const config = getStatusConfig(escrow.status);
        const StatusIcon = config.icon;

        return (
          <div
            key={escrow.escrowId}
            className="rounded-xl border border-gray-800 transition-all duration-300 bg-[#161E2E] p-4 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer group hover:border-[#22D3EE]/50"
            onClick={() => navigate(`/escrow/${escrow.escrowId}`)}
          >
            {/* first child */}
            <div className="w-full flex gap-4 items-center ">
              <div
                className={`size-10 rounded-full flex justify-center items-center ${config.color}`}
              >
                <StatusIcon size={20} />
              </div>
              <div className="flex flex-col">
                <p className="text-[15px] font-medium">{escrow.title}</p>
                <p className="text-[10px] text-muted font-mono">
                  {" "}
                  {escrow.escrowId}{" "}
                </p>
              </div>
            </div>

            {/* second child */}
            <div className=" w-full flex gap-10 justify-between md:items-center ">
              {/* value */}
              <div className="flex flex-col gap-2 items-end justify-end">
                <p className="w-15 h-3 text-right text-muted text-[12px]">
                  VALUE
                </p>
                <p className="text-[12px] font-bold"> {escrow.amount} KAS </p>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1 md:gap-2 items-end justify-end">
                <p className="w-15 h-3 text-right text-muted text-[12px]">
                  STATUS
                </p>
                <p
                  className={`text-[11px] font-bold uppercase tracking-wider text-right px-3 py-1 rounded-xl ${config.color} ${config.bg}`}
                >
                  {escrow.status.replace("_", " ")}
                </p>
              </div>
              <ArrowRight className="text-muted/60 group-hover:text-[#22D3EE] transition-colors" />
            </div>
          </div>
        );
      })}
    </>
  );
}

// Main Component
function MyEscrows() {
  const { navOpen } = useSidebar();

  return (
    <div
      className={`w-full max-w-full flex flex-col gap-5 overflow-x-hidden ${navOpen ? "md:ml-69 ml-10" : "ml-4 max-[480px]:mt-10 min-[480px]:ml-15"} mb-10 pt-3 pr-4 transition-all duration-300`}
    >
      <div className="w-full mt-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[24px] font-semibold">Recent Escrows</p>
        </div>

        <EscrowList />
      </div>
    </div>
  );
}

export default MyEscrows;
