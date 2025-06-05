import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // For generating secure random tokens
import { PrismaClient } from '../generated/prisma'; // Import Prisma client directly
import { UserService } from './user.service';
import { OtpService } from './otp.service'; // Import OtpService
import { EmailService } from './email.service'; // Import EmailService
// import { OtpService } from './otp.service'; // Placeholder for OTP service

const prisma = new PrismaClient(); // Instantiate Prisma client

// Load JWT secret from environment variables (important for security)
// Provide a default for development, but throw an error if not set in production
const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret-key';
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'default-dev-secret-key') {
  console.error('FATAL ERROR: JWT_SECRET is not set in production environment!');
  process.exit(1);
}
const JWT_EXPIRES_IN = '15m'; // Short-lived access token (e.g., 15 minutes)
const REFRESH_TOKEN_BYTES = 64;
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // How long a refresh token family is valid (e.g., 7 days)

// Helper function to generate refresh token expiry date
function getRefreshTokenExpiry(): Date {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  return date;
}

// Helper function to generate secure random string
function generateSecureToken(bytes: number): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export const AuthService = {
  // Renamed to reflect it starts the registration process
  async requestRegistration(username: string, email: string, plainTextPassword: string) {
    // Basic validation happens in UserService.createUser
    try {
      // Create user (starts as unverified, triggers OTP)
      const user = await UserService.createUser(username, email, plainTextPassword);
      // REMOVE: Don't need to destructure hashedPassword here as it's not returned
      // const { hashedPassword: _, ...userWithoutPassword } = user;
      return { message: 'Registration successful. Please check your email for verification OTP.', user: user }; // Return the user object directly
    } catch (error: any) {
      // Handle specific errors like username/email taken
      console.error('Registration error:', error.message);
      throw error; // Re-throw for the route handler
    }
  },

  async verifyOtpAndActivateUser(userId: string, otp: string) {
    // --- Integration: Verify OTP --- 
    const isValid = await OtpService.verifyOtp(userId, otp);
    // --- End Integration ---

    if (!isValid) {
      throw new Error('Invalid or expired OTP.');
    }

    // Mark user as verified in the database
    const verifiedUser = await UserService.setUserVerified(userId);

    // --- Integration: Delete OTP --- 
    await OtpService.deleteOtp(userId);
    // --- End Integration ---
    
    return { message: 'Email verified successfully.', user: verifiedUser };
  },

  async resendOtp(email: string) {
    // --- Integration: Find user, generate/send OTP --- 
    const user = await UserService.findUserByEmail(email);
    if (user && !user.isVerified) {
      try {
        const otp = await OtpService.generateAndStoreOtp(user.id); // Use user ID
        await EmailService.sendOtpEmail(user.email, otp);
        return { message: 'A new OTP has been sent to your email address.' };
      } catch (error) {
        console.error(`Error resending OTP for ${email}:`, error);
        throw new Error('Failed to resend verification code.');
      }
    } else if (user && user.isVerified) {
      // User exists but is already verified
      return { message: 'Account is already verified.' };
    } else {
      // No user found for this email
       return { message: 'If an unverified account exists for this email, a new OTP has been sent.' };
    }
     // --- End Integration ---
  },

  async login(username: string, plainTextPassword: string) {
    const user = await UserService.findUserByUsernameWithPassword(username);
    if (!user || !user.isVerified) {
      throw new Error('Invalid username, password, or user not verified.');
    }

    const isPasswordValid = await argon2.verify(user.hashedPassword, plainTextPassword);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password.');
    }

    // Generate tokens
    const accessToken = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshTokenValue = generateSecureToken(REFRESH_TOKEN_BYTES);
    const refreshTokenFamily = generateSecureToken(32); // Family ID
    const refreshTokenExpiry = getRefreshTokenExpiry();

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        family: refreshTokenFamily,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
        isUsed: false,
      }
    });

    // Return tokens (refresh token value is typically sent via secure cookie)
    const { hashedPassword: _, ...userWithoutPassword } = user;
    return {
      accessToken,
      refreshToken: refreshTokenValue, // Send value back for client to store (e.g., in cookie)
      user: userWithoutPassword,
    };
  },

  async refreshAccessToken(incomingRefreshToken: string) {
    if (!incomingRefreshToken) {
      throw new Error('Refresh token required.');
    }

    // Find the refresh token in DB
    const existingToken = await prisma.refreshToken.findUnique({
      where: { token: incomingRefreshToken },
    });

    // Check if token exists
    if (!existingToken) {
      // Possible theft attempt if someone tries a non-existent token
      // Optional: Add logging here
      throw new Error('Invalid refresh token.');
    }

    // Check if token is already used (indicates potential reuse/theft)
    if (existingToken.isUsed) {
      console.warn(`Refresh token reuse detected for family: ${existingToken.family}, user: ${existingToken.userId}. Blacklisting family.`);
      // Blacklist the entire family
      await prisma.refreshToken.deleteMany({
        where: { 
          family: existingToken.family,
          userId: existingToken.userId
        }
      });
      throw new Error('Invalid refresh token (reuse detected).');
    }

    // Check if token is expired
    if (new Date() > existingToken.expiresAt) {
      // Optional: Clean up expired tokens periodically, but handle expired on check too
       await prisma.refreshToken.delete({ where: { id: existingToken.id } }); // Delete the specific expired token
      throw new Error('Refresh token expired.');
    }

    // --- Token Rotation --- 
    // Mark the current token as used
    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { isUsed: true },
    });

    // Generate new tokens
    const user = await UserService.findUserById(existingToken.userId); // Fetch user details
    if (!user) throw new Error('User associated with token not found.'); // Should not happen

    const newAccessToken = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const newRefreshTokenValue = generateSecureToken(REFRESH_TOKEN_BYTES);
    const refreshTokenExpiry = getRefreshTokenExpiry(); // Get new expiry based on *now*

    // Store the new refresh token (same family)
    await prisma.refreshToken.create({
      data: {
        token: newRefreshTokenValue,
        family: existingToken.family, // Keep the same family
        userId: user.id,
        expiresAt: refreshTokenExpiry,
        isUsed: false,
      }
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenValue,
    };
  },

  async logout(incomingRefreshToken: string) {
     if (!incomingRefreshToken) {
       return { message: 'No refresh token provided.' };
     }
     try {
         // Delete the specific refresh token
        await prisma.refreshToken.delete({ 
            where: { token: incomingRefreshToken }
        });
        return { message: 'Logged out successfully.' };
     } catch (error) {
         // Handle case where token might already be deleted or doesn't exist
         console.warn('Error during logout (token possibly not found):', error);
         return { message: 'Logout completed or token invalid.' };
     }
  },

  verifyToken(token: string) {
    try {
      // Verify the token and return the decoded payload
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded as { userId: string; username: string; iat: number; exp: number };
    } catch (error) {
      // Handle specific errors like TokenExpiredError or JsonWebTokenError
      console.error('JWT Verification Error:', error);
      throw new Error('Invalid or expired token.');
    }
  },
}; 