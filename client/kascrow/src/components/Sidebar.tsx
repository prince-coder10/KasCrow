import {
  Clock,
  FileText,
  LayoutDashboard,
  Plus,
  Settings,
  SidebarIcon,
} from "lucide-react";
import logo from "./../assets/kascrow.png";
import { useEffect } from "react";
import MiniBar from "./MiniBar";
import useSidebar from "../hooks/useSidebarContext";
import { useLocation, useNavigate } from "react-router-dom";
import WalletSatus from "./WalletStatus";
import { useWallet } from "../hooks/useWalletContext";
import { useQueryClient } from "@tanstack/react-query";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const isActive = (path: string) => pathname === path;
  const { disconnect, wallet } = useWallet();
  const queryClient = useQueryClient();

  // const [navOpen, setNavOpen] = useState(true);
  // const [retract, setRetract] = useState(false);
  // const [showMiniBar, setShowMiniBar] = useState(false);
  const {
    navOpen,
    setNavOpen,
    retract,
    setRetract,
    showMiniBar,
    setShowMiniBar,
  } = useSidebar();

  const handleNavToggle = () => {
    setRetract(true);
  };

  const handleDisconnect = async () => {
    await disconnect();
    await queryClient.invalidateQueries({ queryKey: ["myEscrows"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    await queryClient.invalidateQueries({ queryKey: ["settlements"] });
  };

  useEffect(() => {
    if (retract) {
      const timer = setTimeout(() => {
        setNavOpen(false);
        setShowMiniBar(true);
        // setRetract(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [retract]);

  useEffect(() => {
    if (navOpen) {
      requestAnimationFrame(() => {
        setRetract(false);
      });
    }
  }, [navOpen]);

  // connect wallet

  return (
    <>
      {!navOpen && showMiniBar && <MiniBar />}

      {navOpen && (
        <div
          className={`
    fixed inset-y-0 left-0 z-50 w-64 bg-[#0B0F14] border-r border-gray-800 transform transition-transform duration-300 ease-in-out
     ${retract ? "-translate-x-64" : "translate-x-0"}
  `}
        >
          {/* logo */}
          <div className="w-full flex justify-between items-center px-5">
            <div className="flex items-center my-5">
              <img
                src={logo}
                alt="KasCrow Logo"
                className="w-10 object-contain"
              />
              <div>
                <p className="font-black">KasCrow</p>
                <p className="text-[10px] text-primary font-normal">
                  TRUSTLESS PROTOCOL
                </p>
              </div>
            </div>
            <SidebarIcon
              size={20}
              className="text-primary"
              onClick={() => handleNavToggle()}
            />
          </div>
          {/* Navigation */}
          <nav className="border-b  border-gray-800 mx-5">
            <ul
              className="select-none flex flex-col gap-2 *:py-4 *:flex *:items-center *:gap-3 text-gray-300 *:text-[12px] *:*:size-4 *:*:ml-3 mb-5
        *:rounded-xl "
            >
              <li
                onClick={() => {
                  navigate("/dashboard");
                }}
                className={`${isActive("/dashboard") ? "active-nav" : ""}`}
              >
                <LayoutDashboard /> Dashboard
              </li>
              <li
                onClick={() => {
                  navigate("/create");
                }}
                className={`${isActive("/create") ? "active-nav" : ""}`}
              >
                <Plus />
                New Escrow
              </li>
              <li
                onClick={() => {
                  navigate("/escrows");
                }}
                className={`${isActive("/escrows") ? "active-nav" : ""}`}
              >
                <FileText />
                My Escrows
              </li>
              <li
                // onClick={() => setActive(4)}
                className={`${isActive("/history") ? "active-nav" : ""}`}
              >
                <Clock />
                History
              </li>
              <li
                // onClick={() => setActive(5)}active == 4
                className={`${isActive("/settings") ? "active-nav" : ""}`}
              >
                <Settings />
                Settings
              </li>
            </ul>
          </nav>

          {/* Network */}
          <WalletSatus />

          {wallet.connected && (
            <div
              className="text-danger w-fit mx-5 bg-danger/10 p-2 mt-2 rounded-xl cursor-pointer text-[10px]"
              onClick={() => handleDisconnect()}
            >
              <p> disconnect wallet</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default Sidebar;
