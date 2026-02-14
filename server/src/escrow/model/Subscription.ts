import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubscription extends Document {
  addresses: string[];
}

interface ISubscriptionModel extends Model<ISubscription> {
  addAddresses(newAddresses: string[]): Promise<ISubscription>;
  getAddresses(): Promise<string[]>;
}

const subscriptionSchema = new Schema<ISubscription>({
  addresses: { type: [String], default: [] },
});

// Static method to add addresses
subscriptionSchema.statics.addAddresses = async function (
  newAddresses: string[],
) {
  let sub = await this.findOne();
  if (!sub) {
    sub = await this.create({ addresses: [] });
  }

  // Avoid duplicates
  sub.addresses = Array.from(new Set([...sub.addresses, ...newAddresses]));
  await sub.save();
  return sub;
};

// Static method to get all addresses
subscriptionSchema.statics.getAddresses = async function () {
  const sub = await this.findOne();
  return sub?.addresses || [];
};

export const Subscription = mongoose.model<ISubscription, ISubscriptionModel>(
  "Subscription",
  subscriptionSchema,
);
