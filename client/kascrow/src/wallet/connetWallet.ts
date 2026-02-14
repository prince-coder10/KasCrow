import { getKasKeeper } from "./getKasKeeper";

export const connectKasKeeper = async () => {
  const KasKeeper = getKasKeeper();

  // triggers popup
  const accounts: string[] = await KasKeeper.requestAccounts();

  if (!accounts || !accounts.length)
    throw new Error("No kaspa accounts returned");

  const network: string = KasKeeper._network;

  // primary address
  return { address: accounts[0], network };
};

export const disconnectKasKeeper = async () => {
  const KasKeeper = getKasKeeper();

  // triggers popup
  await KasKeeper.disconnect();
};
