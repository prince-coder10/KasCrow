import "./App.css";
import Hero from "./pages/Hero";
import { Route, Routes } from "react-router-dom";
import HeroLayout from "./components/layouts/HeroLayout";
import Dashboard from "./pages/app/Dashboard";
import AppLayout from "./components/layouts/AppLayout";
import { SidebarProvider } from "./contexts/SidebarContext";
import CreateEscrow from "./pages/app/CreateEscrow";
import Escrow from "./pages/app/Escrow";
import MyEscrows from "./pages/app/MyEscrows";
import Settlements from "./pages/app/Settlements";
import CreateSettlement from "./pages/app/CreateSettlement";
import ViewSettlement from "./pages/app/ViewSettlement";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <SidebarProvider>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route element={<HeroLayout />}>
            <Route path="/" element={<Hero />} />
          </Route>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreateEscrow />} />
            <Route path="/escrows" element={<MyEscrows />} />
            <Route path="/escrow/:id" element={<Escrow />} />
            <Route path="/settlements" element={<Settlements />} />
            <Route
              path="/settlement/:id/create"
              element={<CreateSettlement />}
            />
            <Route
              path="/escrow/settlement/:id/view"
              element={<ViewSettlement />}
            />
          </Route>
        </Routes>
      </QueryClientProvider>
    </SidebarProvider>
  );
}

export default App;
