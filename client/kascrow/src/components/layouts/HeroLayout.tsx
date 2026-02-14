import { Outlet } from "react-router-dom";
import HeroHeader from "../HeroHeader";

export default function HeroLayout() {
  return (
    <div className="min-h-screen max-w-full">
      <HeroHeader />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
