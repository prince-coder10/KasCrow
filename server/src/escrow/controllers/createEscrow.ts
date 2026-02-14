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

export const createEscrow = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user)
      return res.status(401).json({
        success: false,
        message: "Unauthorized to perfom this action",
      });

    const { title, amount, vendorAddress } = req.body;
    if (!title || !amount || !vendorAddress) {
      return res
        .status(400)
        .json({ error: "title, amount and vendorAddress required" });
    }
    const buyerAddress = user.wallet;

    if (typeof title !== "string")
      return res.status(400).json({
        success: false,
        message: "Invalid type. title should be a string",
      });

    if (typeof buyerAddress !== "string" || typeof vendorAddress !== "string")
      return res.status(400).json({
        success: false,
        message: "Invalid type. addresses should be strings",
      });

    const escrow = await Escrow.createEscrow(
      title,
      Number(amount),
      buyerAddress,
      vendorAddress,
    );
    res.json({ success: true, escrow });
  } catch (error) {
    catchError(res, error);
  }
};
