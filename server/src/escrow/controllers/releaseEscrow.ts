import type { Response } from "express";
import type { AuthRequest } from "../../middleware/requireAuth.js";
import EscrowService from "../services/escrow.service.js";
import EscrowStore from "../escrow.store.js";
import { SettlementService } from "../../settlement/settlement.service.js";
import { SettlementStore } from "../../settlement/settlement.store.js";
import { FileStorageService } from "../../settlement/files/fileStore.service.js";

const Settlement = new SettlementService(
  new SettlementStore(),
  new FileStorageService(),
);
const Escrow = new EscrowService(new EscrowStore(), Settlement);

export const releaseEscrowFunds = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user)
      return res.status(401).json({
        success: false,
        message: "Unauthorized to perfom this action",
      });
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Invalid escrow ID" });
    }

    const txId = await Escrow.releaseEscrowFunds(id, user.id);
    res.json({ success: true, txId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
