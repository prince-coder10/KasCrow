import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../errors/auth.erros.js";
import { createSettlementInput, createSettlementSchema } from "../utils/zod.js";
import { SettlementStore } from "./settlement.store.js";
import { FileStorageService } from "./files/fileStore.service.js";
import Settlement_Type from "../config/options.js";
import { decrypt, encrypt } from "../escrow/escrow.utils.js";
import { Actor } from "../escrow/machine/escrow.fsm.js";
import { ISettlement } from "./model/Settlement.js";

export class SettlementService {
  constructor(
    private readonly settlementStore: SettlementStore,
    private readonly fileStore: FileStorageService,
  ) {}

  async create(input: createSettlementInput) {
    const validInput = createSettlementSchema.safeParse(input);
    if (!validInput.success) {
      throw new BadRequestError("Invalid settlement data");
    }

    console.log("valid input success", input.type);

    const settlementData: Record<string, any> = {};

    if (input.type === Settlement_Type.TEXT) {
      if (!input.content) {
        throw new BadRequestError(
          "Settlement of type 'TEXT' must have content",
        );
      }

      settlementData.content = await encrypt(input.content);
    }

    if (input.type === Settlement_Type.DOCUMENT) {
      if (!input.file) {
        throw new BadRequestError(
          "Settlement of type 'DOCUMENT' must include a file",
        );
      }

      settlementData.fileUrl = await this.fileStore.uploadPrivateFile({
        buffer: input.file.buffer,
        mimeType: input.file.mimeType,
        filename: input.file.filename,
      });
    }

    const final = {
      escrow: input.escrow,
      type: input.type,
      ...settlementData,
    };

    console.log("final settlement data", final);

    return this.settlementStore.create(final);
  }

  async getSettlmentByEscrow(_id: string) {
    const settlement = await this.settlementStore.getByEscrow(_id);
    if (!settlement) throw new NotFoundError("settlement was not found");
    return settlement;
  }

  async signDownloadUrl(settlement: ISettlement, actor: Actor) {
    if (actor !== "buyer") throw new UnauthorizedError();
    if (settlement.type === "TEXT")
      throw new BadRequestError("Cannot sign url for file of type 'TEXT'");
    const fileKey = settlement.fileUrl;
    if (!fileKey) throw new BadRequestError("file was not found");
    const { signedUrl, expiresIn } =
      await this.fileStore.signDownloadUrl(fileKey);

    return { signedUrl, expiresIn };
  }

  async decryptText(settlement: ISettlement, actor: Actor) {
    if (actor !== "buyer") throw new UnauthorizedError();
    if (settlement.type === "DOCUMENT")
      throw new BadRequestError("Cannot decrypt for file of type 'DOCUMENT'");
    const payload = settlement.content;
    if (!payload) throw new BadRequestError("file was not found");
    const decrypted = await decrypt(payload);
    return { text: decrypted };
  }
}
