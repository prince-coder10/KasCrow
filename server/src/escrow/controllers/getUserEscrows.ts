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

export async function getUserEscrows(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user)
      return res.status(401).json({
        success: false,
        message: "Unauthorized to perfom this action",
      });

    const escrows = await Escrow.getEscrowsByAddress(user.wallet);
    return res.status(200).json({
      success: true,
      message: "escrows fetched successfully",
      escrows,
    });
  } catch (error) {
    catchError(res, error);
  }
}

export async function getSingleEscrow(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user)
      return res.status(401).json({
        success: false,
        message: "Unauthorized to perfom this action",
      });
    const { escrowId } = req.params;
    if (!escrowId || typeof escrowId !== "string") {
      return res.status(400).json({ error: "Invalid escrow ID" });
    }

    const escrow = await Escrow.getEscrowById(escrowId);
    if (!escrow)
      return res
        .status(404)
        .json({ success: false, message: "escrow not found", escrow });

    return res.status(200).json({
      success: true,
      message: "escrow retrieved successfully",
      escrow,
    });
  } catch (error) {
    catchError(res, error);
  }
}

export async function getUnackedEscrows(req: AuthRequest, res: Response) {
  console.log("getUnackedEscrows");
  try {
    const user = req.user;
    if (!user)
      return res.status(401).json({
        success: false,
        message: "Unauthorized to perfom this action",
      });

    const escrows = await Escrow.getUnackedEscrows(user.wallet);
    console.log(escrows);

    return res.status(200).json({
      success: true,
      message: "escrow retrieved successfully",
      escrows,
    });
  } catch (error) {
    catchError(res, error);
  }
}
