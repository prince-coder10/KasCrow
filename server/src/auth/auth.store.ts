import { User, type IUser } from "./User.model.js";

export class UserStore {
  async createUser(walletAddress: string): Promise<IUser> {
    const user = await User.create({ walletAddress });
    return user;
  }

  async getByWallet(walletAddress: string): Promise<IUser | null> {
    return await User.findOne({ walletAddress });
  }

  async getById(userId: string): Promise<IUser | null> {
    return await User.findOne({ _id: userId });
  }

  async findOrCreate(walletAddress: string): Promise<IUser> {
    const existingUser = await User.findOne({ walletAddress });

    if (existingUser) return existingUser;

    const user = await User.create({ walletAddress });
    return user;
  }

  async updateSessionToken(
    walletAddress: string,
    tokenHash?: string,
  ): Promise<IUser | null> {
    if (!tokenHash) {
      // Clear the token if no tokenHash is provided
      return User.findOneAndUpdate(
        { walletAddress },
        { $set: { sessionToken: null } },
        { new: true },
      );
    }

    // Update or create the token object
    const updatedUser = await User.findOneAndUpdate(
      { walletAddress },
      {
        $set: {
          sessionToken: {
            tokenHash,
            createdAt: new Date(),
          },
        },
      },
      { new: true, upsert: false }, // upsert false: don't create a new user if wallet doesn't exist
    );

    return updatedUser;
  }

  async updateBanStatus(
    walletAddress: string,
    isBanned: boolean,
  ): Promise<IUser | null> {
    return await User.findOneAndUpdate(
      { walletAddress },
      { isBanned },
      { new: true },
    );
  }

  async incrementTokenVersion(userId: string): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      userId,
      { $inc: { "sessionToken.tokenVersion": 1 } },
      { new: true },
    );
  }
}
