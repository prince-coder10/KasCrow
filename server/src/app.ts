import express, { Express } from "express";
import * as http from "http";
import * as WebSocket from "ws";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import kaspaRoutes from "./routes/kaspaRoutes.js";
import escrowRoutes from "./routes/escrow.routes.js";
import { kaspaRpcService } from "./services/kaspaRpcService.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import { RpcEventMap, sompiToKaspaString } from "@kluster/kaspa-wasm-node";

const app: Express = express();
app.set("json replacer", (_key: string, value: any) => {
  // a replacer function to convert bigint to string
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
});

app.use(
  cors({
    origin: ["https://playerflip.com", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.json());

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Kaspa Node.js Starter Kit API",
      version: "1.0.0",
      description: "API documentation for the Kaspa Node.js Starter Kit",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // Path to the API docs
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get("/", (req, res) => {
  res.send("Kaspa Node.js Starter Kit API");
});

// Kaspa RPC routes
app.use("/kaspa", kaspaRoutes);
app.use("/api/v1/escrow", escrowRoutes);
app.use("/api/v1/auth", authRoutes);

// Initialize WebSocket Server
const server = http.createServer(app);
const wss = new WebSocket.WebSocketServer({ server });

const stringify = (obj: any) =>
  JSON.stringify(obj, (key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );

// ... existing imports

wss.on("connection", (ws: WebSocket.WebSocket) => {
  console.log("WebSocket client connected");

  ws.on("message", async (message: string) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      console.log("parsed message", parsedMessage);
      const { type, event, payload, requestId } = parsedMessage;

      switch (type) {
        // --- NEW: One-time balance request ---
        case "get-balance":
          if (!payload?.address)
            return sendError(ws, "Address required", requestId);
          try {
            const res = await kaspaRpcService.getBalancesByAddresses([
              payload.address,
            ]);

            const final = [
              {
                address: res.entries[0]?.address,
                balance: sompiToKaspaString(res.entries[0]?.balance ?? 0n),
              },
            ];

            console.log(final);
            // FIX: Use the stringify helper here!
            ws.send(
              stringify({
                type: "balance-response",
                requestId,
                data: final,
              }),
            );
          } catch (err: any) {
            sendError(ws, err.message, requestId);
          }
          break;

        // --- NEW: Subscribe to real-time balance updates ---
        case "watch-address":
          if (!payload?.address)
            return sendError(ws, "Address required", requestId);
          try {
            await kaspaRpcService.watchAddress(payload.address, ws);

            // Optional: Send initial balance immediately so they don't wait for a change
            const initialBalance = await kaspaRpcService.getBalancesByAddresses(
              [payload.address],
            );
            ws.send(
              JSON.stringify({
                type: "balance-update",
                address: payload.address,
                data: initialBalance,
              }),
            );
          } catch (err: any) {
            sendError(ws, err.message, requestId);
          }
          break;

        // --- EXISTING: Standard Events ---
        case "subscribe":
          if (event) kaspaRpcService.subscribe(event, ws);
          break;

        case "unsubscribe":
          if (event) kaspaRpcService.unsubscribe(event, ws);
          break;

        default:
          ws.send(JSON.stringify({ error: "Unknown message type" }));
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
    // CRITICAL: Clean up address listeners to prevent memory leaks
    kaspaRpcService.unwatchAll(ws);

    const allKnownEvents: (keyof RpcEventMap)[] = [
      "block-added",
      "virtual-daa-score-changed",
      "virtual-chain-changed",
    ];
    allKnownEvents.forEach((event) => {
      kaspaRpcService.unsubscribe(event, ws);
    });
  });
});

// Helper for cleaner errors
function sendError(
  ws: WebSocket.WebSocket,
  message: string,
  requestId?: string,
) {
  if (ws.readyState === WebSocket.WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "error", message, requestId }));
  }
}

export { app, server, wss };
