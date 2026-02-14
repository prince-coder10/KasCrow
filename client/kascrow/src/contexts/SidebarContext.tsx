import React, { createContext, useState } from "react";

export type SidebarContextType = {
  navOpen: boolean;
  setNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
  retract: boolean;
  setRetract: React.Dispatch<React.SetStateAction<boolean>>;
  showMiniBar: boolean;
  setShowMiniBar: React.Dispatch<React.SetStateAction<boolean>>;
};

export const SidebarContext = createContext<SidebarContextType | undefined>(
  undefined,
);

interface SidebarProviderProps {
  children: React.ReactNode;
}

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const [navOpen, setNavOpen] = useState<boolean>(true);
  const [retract, setRetract] = useState<boolean>(false);
  const [showMiniBar, setShowMiniBar] = useState<boolean>(false);

  return (
    <SidebarContext.Provider
      value={{
        navOpen,
        setNavOpen,
        retract,
        setRetract,
        showMiniBar,
        setShowMiniBar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;
