import z from "zod";
import Settlement_Type from "../config/options.js";

export const createSettlementSchema = z.object({
  escrow: z.string(),
  type: z.enum(["TEXT", "DOCUMENT"]),

  // TEXT settlement
  content: z.string().optional(),

  // DOCUMENT settlement (validated in service)
  file: z
    .object({
      buffer: z.any(), // Buffer validated at runtime
      mimeType: z.string(),
      filename: z.string(),
    })
    .optional(),
});

export type createSettlementInput = z.infer<typeof createSettlementSchema>;
