import { hashToken } from "../utils/hash.js";
import { signSessionToken } from "../utils/jwt.js";
import { UserStore } from "./auth.store.js";
import type { IUser } from "./User.model.js";

export class UserService {
  constructor(private readonly userStore: UserStore) {}

  async findOrCreateUser(walletAddress: string): Promise<IUser> {
    if (!walletAddress) {
      throw new Error("Wallet address is required");
    }
    const user = await this.userStore.findOrCreate(walletAddress);
    if (user.isBanned) {
      throw new Error("User is banned");
    }
    return user;
  }

  issueJWT(user: IUser): string {
    if (user.isBanned) {
      throw new Error("User is banned");
    }

    const tokenVersion = user.sessionToken.tokenVersion;

    const sessionToken = signSessionToken({
      sub: user._id.toString(),
      wallet: user.walletAddress,
      v: tokenVersion,
      iat: Date.now(),
    });

    return sessionToken;
  }

  async getUserByWallet(walletAddress: string): Promise<IUser | null> {
    if (!walletAddress) {
      throw new Error("Wallet address is required");
    }
    const user = await this.userStore.getByWallet(walletAddress);
    if (!user) throw new Error("User not found");
    return user;
  }

  async getUserById(userId: string): Promise<IUser | null> {
    if (!userId) {
      throw new Error("user id is required");
    }
    const user = await this.userStore.getById(userId);
    if (!user) throw new Error("User not found");
    return user;
  }

  async banUser(walletAddress: string): Promise<IUser | null> {
    return this.userStore.updateBanStatus(walletAddress, true);
  }

  async unbanUser(walletAddress: string): Promise<IUser | null> {
    return this.userStore.updateBanStatus(walletAddress, false);
  }

  async invalidateUserSession(userId: string): Promise<IUser | null> {
    if (!userId) {
      throw new Error("User ID is required");
    }
    return this.userStore.incrementTokenVersion(userId);
  }
}
