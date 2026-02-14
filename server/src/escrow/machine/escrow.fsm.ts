import { IEscrow } from "../model/Escrow.js";
import type { EscrowStatus } from "../../config/TR_STATUSES.js";

export type Actor = "buyer" | "vendor" | "system" | "admin";

const ESCROW_TRANSITIONS: Record<string, Record<string, Actor[]>> = {
  CREATED: {
    AWAITING_PAYMENT: ["vendor"],
    EXPIRED: ["system"],
  },

  AWAITING_PAYMENT: {
    PARTIALLY_FUNDED: ["system"],
    FUNDED: ["system"],
    EXPIRED: ["system"],
  },

  PARTIALLY_FUNDED: {
    FUNDED: ["system"],
    EXPIRED: ["system"],
  },

  FUNDED: {
    AWAITING_RELEASE: ["buyer"],
    DISPUTED: ["buyer", "vendor"],
  },

  AWAITING_RELEASE: {
    RELEASED: ["buyer"],
    DISPUTED: ["vendor"],
  },

  RELEASED: {},

  REFUNDED: {},

  EXPIRED: {},
};

export function canTransitionEscrow(
  escrow: IEscrow,
  nextStatus: EscrowStatus,
  actor: Actor,
) {
  const transitions = ESCROW_TRANSITIONS[escrow.status];
  if (!transitions || !transitions[nextStatus]) {
    throw new Error(
      `Illegal escrow transition: ${escrow.status} → ${nextStatus}`,
    );
  }

  const allowedActors = transitions[nextStatus];
  if (!allowedActors.includes(actor)) {
    throw new Error(
      `Actor ${actor} cannot perform ${escrow.status} → ${nextStatus}`,
    );
  }
}
