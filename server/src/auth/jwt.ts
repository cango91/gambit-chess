import jwt, { SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index'; // Assuming prisma client is exported from server/src/index.ts
import { User } from '../generated/prisma'; // Adjusted import path
import crypto from 'crypto'; // Added import
import { timeStringToSeconds } from '../utils/time'; // Import the new utility

// TODO: Move these to .env file
const ACCESS_TOKEN_SECRET: string = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret';
const REFRESH_TOKEN_SECRET: string = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';
const ACCESS_TOKEN_EXPIRATION_STRING: string = process.env.ACCESS_TOKEN_EXPIRATION || '15m';
const REFRESH_TOKEN_EXPIRATION_STRING: string = process.env.REFRESH_TOKEN_EXPIRATION || '7d';
const REFRESH_TOKEN_EXTENDED_EXPIRATION_STRING: string = process.env.REFRESH_TOKEN_EXTENDED_EXPIRATION || '90d';


export interface JwtPayload {
  userId: string;
  username: string;
  // Add other relevant user details if needed, but keep it minimal
}

export const generateAccessToken = (user: Pick<User, 'id' | 'username'>): string => {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
  };
  let expiresInSeconds = timeStringToSeconds(ACCESS_TOKEN_EXPIRATION_STRING);
  if (expiresInSeconds === 0 && ACCESS_TOKEN_EXPIRATION_STRING !== '0') { // Ensure '0' string for no expiry is not treated as error
      console.warn(`Invalid ACCESS_TOKEN_EXPIRATION format: ${ACCESS_TOKEN_EXPIRATION_STRING}. Defaulting to 15 minutes.`);
      // Default to 15 minutes in seconds if format is invalid and not explicitly '0'
      expiresInSeconds = 15 * 60;
  }
  const options: SignOptions = { expiresIn: expiresInSeconds };
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, options);
};

export const generateRefreshToken = async (
  userId: string,
  rememberMe: boolean = false
): Promise<{ token: string; family: string; expiresAt: Date }> => {
  const family = crypto.randomUUID(); // Generate a new family ID for this refresh token
  const baseExpirationString = rememberMe ? REFRESH_TOKEN_EXTENDED_EXPIRATION_STRING : REFRESH_TOKEN_EXPIRATION_STRING;
  
  let expiresInSeconds = timeStringToSeconds(baseExpirationString);
   if (expiresInSeconds === 0 && baseExpirationString !== '0') {
      console.warn(`Invalid refresh token expiration format: ${baseExpirationString}. Defaulting to 7 days.`);
      // Default to 7 days in seconds if format is invalid and not explicitly '0'
      expiresInSeconds = 7 * 24 * 60 * 60;
  }

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000); // expiresInSeconds is already in seconds

  const options: SignOptions = { expiresIn: expiresInSeconds };
  const token = jwt.sign({ userId, family }, REFRESH_TOKEN_SECRET, options);

  // Store the refresh token in the database
  await prisma.refreshToken.create({
    data: {
      token,
      family,
      userId,
      expiresAt,
    },
  });

  return { token, family, expiresAt };
};

export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): { userId: string; family: string } | null => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: string; family: string };
  } catch (error) {
    return null;
  }
};

// Middleware to authenticate requests
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: 'Access token is required' });
    return;
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    res.status(403).json({ message: 'Invalid or expired access token' });
    return;
  }

  (req as AuthenticatedRequest).user = decoded;
  next();
};

// Function to blacklist a token family (all tokens in that family)
export const blacklistTokenFamily = async (family: string) => {
    await prisma.refreshToken.updateMany({
        where: { family },
        data: { isUsed: true }, // Mark all tokens in the family as used/invalid
    });
};

export const rotateRefreshToken = async (oldRefreshToken: string, rememberMe: boolean = false): Promise<{ accessToken: string; refreshToken: string } | null> => {
    const decodedOldToken = verifyRefreshToken(oldRefreshToken);

    if (!decodedOldToken) {
        // Invalid refresh token, potentially stolen or malformed
        return null;
    }

    const { userId, family } = decodedOldToken;

    // Check if the token family or specific token has been blacklisted/used
    const storedToken = await prisma.refreshToken.findUnique({
        where: { token: oldRefreshToken },
    });

    if (!storedToken || storedToken.isUsed) {
        // Token is already used or doesn't exist, potential replay attack
        // Blacklist the entire family as a precaution if a used token is presented again
        if (storedToken && storedToken.isUsed) {
            await blacklistTokenFamily(family);
        }
        return null;
    }

    // Mark the old token as used
    await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isUsed: true },
    });

    // Issue new tokens
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        // This should not happen if the refresh token was valid
        await blacklistTokenFamily(family); // Blacklist family as a precaution
        return null;
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshTokenData = await generateRefreshToken(userId, rememberMe); // New token gets a new family

    return { accessToken: newAccessToken, refreshToken: newRefreshTokenData.token };
}; 