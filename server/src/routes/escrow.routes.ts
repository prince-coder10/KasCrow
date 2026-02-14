import { Router } from "express";
import type { Request, Response } from "express";
import { kaspaRpcService } from "../services/kaspaRpcService.js";
import { createEscrow } from "../escrow/controllers/createEscrow.js";
import { getEscrowStatus } from "../escrow/controllers/getEscrowStatus.js";
import { releaseEscrowFunds } from "../escrow/controllers/releaseEscrow.js";
import { acknowledgeEscrow } from "../escrow/controllers/vendorAck.js";
import { allowFundsRelease } from "../escrow/controllers/allowRelease.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  getSingleEscrow,
  getUnackedEscrows,
  getUserEscrows,
} from "../escrow/controllers/getUserEscrows.js";
import { createBuffer } from "../middleware/upload.js";
import { getDashboardStats } from "../escrow/controllers/dashboard.controller.js";

const router: Router = Router();

router.post("/create", requireAuth, createEscrow);

router.post(
  "/:escrowId/settlement/ack",
  requireAuth,
  createBuffer,
  acknowledgeEscrow,
);

router.get("/dashboard", requireAuth, getDashboardStats);

router.get("/:id/status", requireAuth, getEscrowStatus);

router.post("/:escrowId/allow", requireAuth, allowFundsRelease);

router.post("/:id/release", requireAuth, releaseEscrowFunds);

router.get("/unacked", requireAuth, getUnackedEscrows);
router.get("/:escrowId", requireAuth, getSingleEscrow);

router.get("/", requireAuth, getUserEscrows);

// router.post("/escrow/:id/check", async (req: Request, res: Response) => {
//   const escrow = escrows.get(req.params.id);
//   if (!escrow) return res.status(404).json({ error: "Not found" });

//   const utxos = await kaspaRpcService
//     .getRpcClient()
//     .getUtxosByAddresses([escrow.address]);
//   const balance = utxos.reduce((a, u) => a + BigInt(u.amount), 0n);

//   if (balance >= BigInt(escrow.amount)) {
//     escrow.status = "FUNDED";
//   }

//   res.json({ balance: balance.toString(), status: escrow.status });
// });

export default router;
