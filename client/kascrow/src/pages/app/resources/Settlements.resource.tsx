import { useQuery } from "@tanstack/react-query";
import { api } from "../../../apis/axios";
import type { IEscrow } from "./MyEscrows.resource";

const fetchSettlements = async (): Promise<IEscrow[]> => {
  const response = await api.get<{ escrows: IEscrow[] }>("/escrow/unacked");
  return response.data.escrows || [];
};

export const useSettlements = () => {
  return useQuery({
    queryKey: ["settlements"],
    queryFn: fetchSettlements,
  });
};
