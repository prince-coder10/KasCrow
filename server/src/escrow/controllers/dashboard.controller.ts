import type { Response } from "express";
import type { AuthRequest } from "../../middleware/requireAuth.js";
import EscrowService from "../services/escrow.service.js";
import EscrowStore from "../escrow.store.js";
import { catchError } from "../../utils/catchError.js";
import { SettlementService } from "../../settlement/settlement.service.js";
import { SettlementStore } from "../../settlement/settlement.store.js";
import { FileStorageService } from "../../settlement/files/fileStore.service.js";

const Settlement = new SettlementService(
  new SettlementStore(),
  new FileStorageService(),
);
const Escrow = new EscrowService(new EscrowStore(), Settlement);

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user)
      return res.status(401).json({
        success: false,
        message: "Unauthorized to perfom this action",
      });

    const stats = await Escrow.getDashboardStats(user.wallet);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: "No stats found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",
      stats,
    });
  } catch (error) {
    catchError(res, error);
  }
};
