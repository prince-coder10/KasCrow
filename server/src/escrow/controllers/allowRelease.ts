import type { Response } from "express";
import EscrowService from "../services/escrow.service.js";
import EscrowStore from "../escrow.store.js";
import { catchError } from "../../utils/catchError.js";
import type { AuthRequest } from "../../middleware/requireAuth.js";
import { SettlementService } from "../../settlement/settlement.service.js";
import { SettlementStore } from "../../settlement/settlement.store.js";
import { FileStorageService } from "../../settlement/files/fileStore.service.js";

const Settlement = new SettlementService(
  new SettlementStore(),
  new FileStorageService(),
);
const Escrow = new EscrowService(new EscrowStore(), Settlement);
export async function allowFundsRelease(req: AuthRequest, res: Response) {
  console.log("here1");
  try {
    const user = req.user;
    if (!user)
      return res.status(401).json({
        success: false,
        message: "Unauthorized to perfom this action",
      });
    console.log("user available");

    const senderId = user.id;

    const { escrowId } = req.params;
    if (!escrowId || !senderId)
      return res.status(400).json({
        success: false,
        message: "escrow id and sender id are required",
      });

    if (typeof escrowId !== "string" || typeof senderId !== "string")
      return res.status(400).json({
        success: false,
        message: "escrow id and sender id should be of type 'string'",
      });

    console.log("escrow id and sender id available");

    const settlement = await Escrow.allowRelease(escrowId, senderId);
    res.status(200).json({
      success: true,
      messsage:
        "Settlement verified and escrow funds now available for release",
      settlement,
    });
  } catch (error) {
    catchError(res, error);
  }
}
