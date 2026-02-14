import { useQuery } from "@tanstack/react-query";
import { api } from "../../../apis/axios";
import type { IRecentEscrow } from "../../../components/data";
import { Lock, CircleCheck, Clock, Zap } from "lucide-react";

// Matches backend IEscrow structure (simplified)
interface IBackendEscrow {
  escrowId: string;
  title: string;
  amount: number;
  status: string;
}

// Matches backend response structure
interface IBackendDashboardStats {
  activeEscrows: number;
  completedEscrows: number;
  unackedEscrows: number;
  recentEscrows: IBackendEscrow[];
  totalReceived: number;
}

export interface IDashboardStats {
  activeEscrows: number;
  completedEscrows: number;
  unackedEscrows: number;
  recentEscrows: IRecentEscrow[];
  totalReceived: number;
}

const mapStatusToIcon = (status: string) => {
  switch (status) {
    case "RELEASED":
      return CircleCheck;
    case "AWAITING_PAYMENT":
    case "PARTIALLY_FUNDED":
      return Clock;
    case "FUNDED":
      return Zap;
    default:
      return Lock;
  }
};

const formatValue = (value: number) => {
  return `${value.toLocaleString()} KAS`;
};

async function fetchDashboardStats(): Promise<IDashboardStats> {
  const response = await api.get<{ stats: IBackendDashboardStats }>(
    "/escrow/dashboard",
  );
  const backendStats = response.data.stats;

  return {
    ...backendStats,
    recentEscrows: backendStats.recentEscrows.map((escrow) => ({
      lucide: mapStatusToIcon(escrow.status),
      title: escrow.title,
      id: escrow.escrowId,
      value: formatValue(escrow.amount),
      status: escrow.status,
    })),
  };
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: fetchDashboardStats,
  });
};
