import {
  ArrowRight,
  CircleCheck,
  Clock,
  Plus,
  ShieldCheck,
} from "lucide-react";
import useSidebar from "../../hooks/useSidebarContext";
import { useEffect, useRef, useState } from "react";
// import { recentEscrows /*type IRecentEscrow*/ } from "../../components/data";
import LinesSvg from "../../components/LinesSvg";
import { useNavigate } from "react-router-dom";
import { useDashboardStats } from "./resources/Dashboard.resource";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { Lock } from "lucide-react";
import UnauthorizedError from "../../components/UnauthorizedError";

function Dashboard() {
  const { navOpen } = useSidebar();
  const cardDivRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const { data: stats, isLoading, error } = useDashboardStats();

  useEffect(() => {
    const element = cardDivRef.current;
    if (!element) return;

    const mq = window.matchMedia("(min-width: 768px)");
    let observer: ResizeObserver | null = null;

    const handleMQChange = () => {
      // below md → disable logic
      if (!mq.matches) {
        setIsMobile(false);
        observer?.disconnect();
        observer = null;
        return;
      }

      // md+ → observe width
      if (!observer) {
        observer = new ResizeObserver((entries) => {
          const width = entries[0].contentRect.width;
          setIsMobile(width < 689);
        });
        observer.observe(element);
      }
    };

    // initial run
    handleMQChange();

    // listen to breakpoint changes
    mq.addEventListener("change", handleMQChange);

    return () => {
      mq.removeEventListener("change", handleMQChange);
      observer?.disconnect();
    };
  }, [navOpen]);

  if (isLoading) {
    return <DashboardLayout />;
  }

  if (error || !stats) {
    return (
      <div className="w-full h-full flex items-center justify-center text-red-500">
        <UnauthorizedError />
      </div>
    );
  }

  return (
    <div
      className={` w-full flex flex-col justify-center items-center p-5 ${navOpen ? "md:ml-64 ml-10" : "ml-2 max-[480px]:mt-10 min-[480px]:ml-10"} transition-all duration-300 ease-in-out`}
    >
      {/* Section 1 */}
      <div className="w-full flex flex-col gap-3  md:flex-row md:justify-between md:items-center">
        <div className="flex flex-col gap-2">
          <p className="text-xl font-semibold ">Dashboard</p>
          <p className="text-[12px]">Real-time escrow intelligence</p>
        </div>
        <div>
          <button
            onClick={() => navigate("/create")}
            className="w-full relative overflow-hidden font-medium rounded-lg transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 px-6 py-3 disabled:opacity-50 disabled:pointer-events-none bg-[#22D3EE] text-[#0B0F14] hover:bg-[#67e8f9] shadow-[0_0_15px_rgba(34,211,238,0.3)] "
          >
            <Plus /> New Escrow
          </button>
        </div>
      </div>
      {/* Section 2 */}
      <div
        className={`w-full grid md:grid-cols-3 grid-cols-1 gap-5 mt-10 ${isMobile ? "mobile-grid" : ""}`}
        ref={cardDivRef}
      >
        <div className="bg-card w-full flex items-center justify-between h-35 rounded-xl px-5">
          <div className="flex flex-col gap-1">
            <p className="text-muted text-[12px]">Total Earnings</p>
            <p className="text-xl font-semibold">
              {stats.totalReceived}{" "}
              <span className="text-[12px] text-primary">KAS</span>
            </p>
            {/* <p className="text-[8px] flex text-success items-center mt-2">
              <Zap size={8} />
              +2,400 KAS this week
            </p> */}
          </div>
          <ShieldCheck className="text-primary/20" size={60} />
        </div>
        <div className="bg-card w-full flex items-center justify-between h-35 rounded-xl px-5">
          <div className="flex flex-col gap-1">
            <p className="text-muted text-[12px]">Active Escrow</p>
            <p className="text-2xl font-semibold">{stats.activeEscrows}</p>
            {/* <p className="text-[8px] flex text-muted items-center mt-2">
              <Zap size={8} />2 actions required
            </p> */}
          </div>
          <Clock className="text-secondary/20" size={60} />
        </div>
        <div className="bg-card w-full flex items-center justify-between h-35 rounded-xl px-5">
          <div className="flex flex-col gap-1">
            <p className="text-muted text-[12px]">Completed Deals</p>
            <p className="text-2xl font-semibold">{stats.completedEscrows}</p>
            {/* <p className="text-[8px] flex text-primary items-center mt-2">
              <Zap size={8} />
              100% trust score
            </p> */}
          </div>
          <CircleCheck className="text-success/20" size={60} />
        </div>
        <div
          className="bg-card w-full flex items-center justify-between h-35 rounded-xl px-5 hover:bg-card/80 cursor-pointer transition-colors"
          onClick={() => navigate("/settlements")}
        >
          <div className="flex flex-col gap-1">
            <p className="text-muted text-[12px]">Unacknowledged Escrows</p>
            <p className="text-2xl font-semibold">{stats.unackedEscrows}</p>
            {/* <p className="text-[8px] flex text-primary items-center mt-2">
              <Zap size={8} />
              100% trust score
            </p> */}
          </div>
          <Clock className="text-warning/20" size={60} />
        </div>
      </div>
      {/* Section 3 */}
      <div className=" w-full mt-10 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[18px] font-semibold">Recent Escrows</p>
          <p
            className="text-primary flex text-[12px] items-center cursor-pointer"
            onClick={() => navigate("/escrows")}
          >
            {" "}
            View All <ArrowRight size={12} />{" "}
          </p>
        </div>
        {stats.recentEscrows &&
          stats.recentEscrows.map((recent, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-800 transition-all duration-300 bg-[#161E2E] p-4 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer group hover:border-[#22D3EE]/50"
            >
              {/* first child */}
              <div className="w-full flex gap-4 items-center ">
                <div
                  className={`size-10 rounded-full flex justify-center items-center 
                  ${recent.status === "RELEASED" ? "text-success" : recent.status === "AWAITING_PAYMENT" ? "text-warning" : recent.status === "AWAITING_PAYMENT" ? "text-warning bg-warning/40" : recent.status === "FUNDED" || recent.status === "CREATED" ? "text-primary" : recent.status === "EXPIRED" ? "text-danger" : "text-muted"}  `}
                >
                  <Lock />
                </div>
                <div className="flex flex-col">
                  <p className="text-[15px]">{recent.title}</p>
                  <p className="text-[10px] text-muted"> {recent.id} </p>
                </div>
              </div>
              {/* second child */}
              <div className=" w-full flex gap-10 justify-between md:items-center ">
                {/* value */}
                <div className="flex flex-col gap-2 items-end justify-end">
                  <p className="w-15 h-3 max-[410px]:text-center  text-right text-muted text-[12px]">
                    VALUE
                  </p>
                  <p className="text-[12px]"> {recent.value} </p>
                </div>
                {/* Status */}
                <div className="flex flex-col gap-1 md:gap-2 items-end justify-end">
                  <p className="w-15 h-3  text-right text-muted text-[12px]">
                    STATUS
                  </p>
                  <p
                    className={`text-[14px] text-right px-3 py-1 rounded-xl
                       ${recent.status === "RELEASED" ? "text-success bg-success/40" : recent.status === "AWAITING_PAYMENT" ? "text-warning bg-warning/40" : recent.status === "FUNDED" || recent.status === "CREATED" ? "text-primary bg-primary/40" : recent.status === "EXPIRED" ? "text-danger bg-danger/40" : "text-muted bg-muted/40"} `}
                  >
                    {" "}
                    {recent.status}{" "}
                  </p>
                </div>
                <ArrowRight className="text-muted/60" />
              </div>
            </div>
          ))}
      </div>
      {/* Section 4 */}
      <div className=" relative w-full mt-10 flex justify-center border border-gray-800 rounded-xl">
        <div className="py-6 bg-card flex flex-col justify-between items-center w-full rounded-xl">
          <div className="flex items-center gap-2">
            <div className=" size-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-[13px] text-success">NETWORK LIVE</p>
          </div>
          <p className="text-muted text-[12px]">
            Average Block Time: 1 BPS (Mainnet)
          </p>
        </div>
        <LinesSvg />
      </div>
    </div>
  );
}

export default Dashboard;
