import type { Response } from "express";
import type { AuthRequest } from "../../middleware/requireAuth.js";
import EscrowService from "../services/escrow.service.js";
import EscrowStore from "../escrow.store.js";
import { catchError } from "../../utils/catchError.js";
import { SettlementService } from "../../settlement/settlement.service.js";
import { SettlementStore } from "../../settlement/settlement.store.js";
import { FileStorageService } from "../../settlement/files/fileStore.service.js";
import TR_STATUS from "../../config/TR_STATUSES.js";
import Settlement_Type from "../../config/options.js";
import { ISettlementDataInput } from "../services/escrow.service.js";

const Settlement = new SettlementService(
  new SettlementStore(),
  new FileStorageService(),
);
const Escrow = new EscrowService(new EscrowStore(), Settlement);

export async function acknowledgeEscrow(req: AuthRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    console.log("here, user auth successful");

    const { escrowId } = req.params;
    if (!escrowId) {
      return res.status(400).json({
        success: false,
        message: "Escrow id is required",
      });
    }

    console.log("here, escrow id is valid");

    if (typeof escrowId !== "string" || escrowId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Escrow id must be a non-empty string",
      });
    }

    console.log("here, escrow id is valid");

    const { type, content } = req.body;

    console.log("here, type and content are ", type, content);

    const settlementInput: ISettlementDataInput = {
      type,
      content,
      file: req.file
        ? {
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            filename: req.file.originalname,
          }
        : undefined,
    };

    const settlement = await Escrow.createSettlement(
      escrowId,
      user.id,
      settlementInput,
    );

    console.log("here, settlement is created successfully", settlement);

    return res.status(200).json({
      success: true,
      message: "Escrow acknowledged successfully",
      data: settlement,
    });
  } catch (error) {
    catchError(res, error);
  }
}
