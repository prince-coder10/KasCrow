export const getKasKeeper = () => {
  const walletProvider = (window as any)?.Kaskeeper;

  if (!walletProvider) {
    throw new Error("KasKeeper wallet not installed");
  }

  return walletProvider;
};
