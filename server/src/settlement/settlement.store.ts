import {
  Settlement,
  type CreateSettlementDTO,
  type ISettlement,
} from "./model/Settlement.js";

export class SettlementStore {
  async create(data: CreateSettlementDTO): Promise<ISettlement> {
    return Settlement.create(data);
  }

  async getById(id: string): Promise<ISettlement | null> {
    return Settlement.findById(id).exec();
  }

  async getByEscrow(escrowId: string): Promise<ISettlement | null> {
    return Settlement.findOne({ escrow: escrowId }).exec();
  }

  async update(
    id: string,
    data: Partial<CreateSettlementDTO>,
  ): Promise<ISettlement | null> {
    return Settlement.findOneAndUpdate({ _id: id }, data, {
      new: true, // return updated doc
      runValidators: true, // run schema validation + pre hooks
    }).exec();
  }

  async accept(id: string): Promise<ISettlement | null> {
    return Settlement.findByIdAndUpdate(
      id,
      { acceptedAt: new Date() },
      { new: true },
    ).exec();
  }
}
