// workers/escrowExpiry.worker.ts
import cron from "node-cron";
import EscrowStore from "../escrow.store.js";
import EscrowService from "../services/escrow.service.js";

// Initialize store & service
const escrowStore = new EscrowStore();
const escrowService = new EscrowService(escrowStore);

/**
 * Escrow Expiry Worker
 * - Runs every minute (configurable)
 * - Fetches all pending escrows
 * - Handles expiry and partial refunds
 * - Logs all operations
 */
cron.schedule("*/2 * * * *", async () => {
  console.log(`[EscrowExpiryWorker] Running at ${new Date().toISOString()}`);

  try {
    const escrows = await escrowStore.getPendingEscrows();

    if (escrows.length === 0) {
      console.log("[EscrowExpiryWorker] No pending escrows found");
      return;
    }

    for (const escrow of escrows) {
      try {
        await escrowService.handlePossibleExpiry(escrow);

        // Log status after processing
        console.log(
          `[EscrowExpiryWorker] Escrow ${escrow.escrowId} processed: ${escrow.status}`,
        );
      } catch (escrowErr) {
        console.error(
          `[EscrowExpiryWorker] Failed to process escrow ${escrow.escrowId}:`,
          escrowErr,
        );
      }
    }
  } catch (err) {
    console.error("[EscrowExpiryWorker] Worker failed:", err);
  }
});

console.log("[EscrowExpiryWorker] Cron worker scheduled (every 2 minutes)");
