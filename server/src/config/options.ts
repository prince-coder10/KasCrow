export const maxAgeMsForUnfundedEscrows = 20 * 60 * 1000; // 20 minutes
export const maxAgeMsForEscrowsNotAcked = 20 * 60 * 1000; // 20 minutes

const Settlement_Type = {
  TEXT: "TEXT",
  DOCUMENT: "DOCUMENT",
};

export type SettlementType = keyof typeof Settlement_Type;
export default Settlement_Type;
