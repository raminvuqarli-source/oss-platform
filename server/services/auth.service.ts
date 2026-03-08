import bcrypt from "bcryptjs";
import { storage } from "../storage";
import type { User } from "@shared/schema";
import { logger } from "../utils/logger";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash || !hash.startsWith("$2")) {
    throw new Error("Invalid password hash format. Password reset required.");
  }
  return bcrypt.compare(password, hash);
}

export async function seedOssAdminUser() {
  try {
    const hashedPassword = await hashPassword("ossadmin123");
    const existingUser = await storage.getUserByUsername("oss_admin");
    if (!existingUser) {
      await storage.createUser({
        username: "oss_admin",
        password: hashedPassword,
        role: "oss_super_admin",
        fullName: "OSS Admin User",
        email: "admin@orange-studio.az",
        language: "en",
      });
    } else {
      await storage.updateUser(existingUser.id, { password: hashedPassword });
    }
  } catch (error) {
    logger.error({ err: error }, "Failed to seed OSS admin user");
  }
}
