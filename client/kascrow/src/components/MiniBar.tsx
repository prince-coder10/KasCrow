import useSidebar from "../hooks/useSidebarContext";
import Logo from "../assets/kascrow.png";
import { useEffect, useState } from "react";

function MiniBar() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 480);
    };

    // run once on mount
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const { setNavOpen, setShowMiniBar } = useSidebar();

  const handleNavToggle = () => {
    setNavOpen(true);
    setShowMiniBar(false);
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50
        ${isMobile ? "w-0" : "w-10"}
        bg-[#0B0F14] border-r border-gray-800
        transition-all duration-300 ease-in-out
        overflow-visible
      `}
    >
      <img
        src={Logo}
        alt="KasCrow Logo"
        onClick={handleNavToggle}
        className={`mt-3 cursor-pointer
          ${isMobile ? "fixed size-10 left-2 top-2" : "mx-auto"}
        `}
      />
    </div>
  );
}

export default MiniBar;
