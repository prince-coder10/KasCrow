import { server } from "./app.js";
import { kaspaRpcService } from "./services/kaspaRpcService.js";
import { startEscrowListener } from "./escrow/escrow.listener.js";
import { connectDB } from "./config/mongo.js";
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
import "dotenv/config";
import "./escrow/workers/escrowExpiry.worker.js";

const boot = async () => {
  try {
    console.log("Connecting to Kaspa RPC...");
    await kaspaRpcService.connect();
    console.log(`Kaspa RPC connected to ${kaspaRpcService.getCurrentURL()}`);

    await connectDB();
    await startEscrowListener();
    // console.log(await kaspaRpcService.getBlockDagInfo()); // Temporarily comment out for server startup
  } catch (error) {
    console.error("Failed to connect Kaspa RPC on boot:", error);
    // Depending on criticality, you might want to exit the process or try reconnecting
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
    console.log("API documentation available at /api-docs");
  });
};

boot().catch(console.error);
