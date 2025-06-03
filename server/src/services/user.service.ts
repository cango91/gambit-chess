import { PrismaClient } from "../generated/prisma";
import argon2 from 'argon2';
import { OtpService } from "./otp.service";
import { EmailService } from "./email.service";

const prisma = new PrismaClient();

export const UserService = {
  async createUser(username: string, email: string, plainTextPassword: string) {
    // Basic validation
    if (!username || username.length < 3) {
      throw new Error("Username must be at least 3 characters long.");
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { // Simple email regex
      throw new Error("Invalid email format.");
    }
    if (!plainTextPassword || plainTextPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    // Check if email or username already exists AND is verified
    const existingVerifiedUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: email }
        ],
        isVerified: true,
      }
    });
    if (existingVerifiedUser) {
      throw new Error("Username or email already associated with a verified account.");
    }

    // Hash the password using Argon2
    const hashedPassword = await argon2.hash(plainTextPassword);

    // Create user (or update if unverified user with same email/username exists)
    // Note: A real implementation might handle updates more explicitly or delete
    // old unverified accounts.
    const user = await prisma.user.upsert({
      where: { email: email }, // Use email as the primary constraint for upserting unverified
      update: {
        username,
        hashedPassword,
        isVerified: false // Ensure it stays unverified until OTP
      },
      create: {
        username,
        email,
        hashedPassword,
        isVerified: false, // Start as unverified
      },
    });

    // --- Integration: Generate and send OTP --- 
    try {
      const otp = await OtpService.generateAndStoreOtp(user.id); // Use user ID as identifier
      await EmailService.sendOtpEmail(user.email, otp);
    } catch (error) {
      // Handle OTP/Email error - maybe log it. 
      // Decide if user creation should be rolled back or if user stays unverified.
      // For now, log and continue, user remains unverified.
      console.error(`Failed to send OTP for user ${user.id} (${user.email}):`, error);
      // Optionally re-throw or return a specific status if email is critical
    }
    // --- End Integration --- 

    // Return user without the password hash
    const { hashedPassword: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async findUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) return null;

    const { hashedPassword: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async findUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) return null;

    // Exclude password hash for general lookup
    const { hashedPassword: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  // Method needed by auth service to get user with hash
  async findUserByUsernameWithPassword(username: string) {
    return prisma.user.findUnique({
      where: { username },
    });
  },

  // Method to set user as verified
  async setUserVerified(userId: string) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
    // Exclude password hash
    const { hashedPassword: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}; 