import express, { Request, Response, NextFunction } from 'express';
import argon2 from 'argon2';
import { prisma } from '../index'; // Assuming prisma is exported from server/src index
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, blacklistTokenFamily, AuthenticatedRequest, authenticateToken, rotateRefreshToken } from '../auth/jwt';
import { UserCreateInputSchema, UserLoginInputSchema } from '@gambit-chess/shared'; // Assuming Zod schemas are here
import { z } from 'zod';

const router = express.Router();

// Helper to associate anonymous games
const associateAnonymousGames = async (anonymousId: string, userId: string): Promise<void> => {
    if (!anonymousId) return;
    try {
        // Find games where the anonymousId matches and the user slot (white or black) is not yet taken by a registered user
        // This logic might need refinement based on how anonymous games are structured (e.g., if AI is always one color)
        const gamesToUpdate = await prisma.game.findMany({
            where: {
                anonymousUserId: anonymousId,
                // Ensure we are not overwriting a game already claimed or played by two registered users
                OR: [
                    { whitePlayerId: null },
                    { blackPlayerId: null }
                ]
            }
        });

        for (const game of gamesToUpdate) {
            // Simplistic association: assign the new user to the first available player slot.
            // This assumes anonymous user could be white or black.
            // If anonymous user is always, say, white when playing AI, this can be more specific.
            if (!game.whitePlayerId) {
                await prisma.game.update({
                    where: { id: game.id },
                    data: { whitePlayerId: userId, anonymousUserId: null } // Clear anonymousId
                });
            } else if (!game.blackPlayerId) {
                 await prisma.game.update({
                    where: { id: game.id },
                    data: { blackPlayerId: userId, anonymousUserId: null } // Clear anonymousId
                });
            }
            // If both whitePlayerId and blackPlayerId are somehow filled but anonymousUserId was set,
            // it indicates a data inconsistency or a scenario not handled by this simple logic.
            // For now, we'd just clear the anonymousUserId if it matches.
            else if (game.whitePlayerId && game.blackPlayerId) {
                 await prisma.game.update({
                    where: { id: game.id },
                    data: { anonymousUserId: null }
                 });
            }
        }
        console.log(`Associated ${gamesToUpdate.length} games for anonymousId ${anonymousId} with userId ${userId}`);
    } catch (error) {
        console.error(`Error associating anonymous games for ${anonymousId} with ${userId}:`, error);
    }
};


// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, username, password, anonymousId } = UserCreateInputSchema.parse(req.body);

        const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
        if (existingUserByEmail) {
            res.status(409).json({ message: 'Email already in use' });
            return;
        }
        const existingUserByUsername = await prisma.user.findUnique({ where: { username } });
        if (existingUserByUsername) {
            res.status(409).json({ message: 'Username already in use' });
            return;
        }

        const hashedPassword = await argon2.hash(password);
        const user = await prisma.user.create({
            data: { email, username, hashedPassword, isVerified: false }, // Assuming email verification flow later
        });

        // Associate any past anonymous games
        if (anonymousId) {
            await associateAnonymousGames(anonymousId, user.id);
        }

        const accessToken = generateAccessToken(user);
        const refreshTokenData = await generateRefreshToken(user.id);

        res.status(201).json({
            accessToken,
            refreshToken: refreshTokenData.token,
            user: { id: user.id, username: user.username, email: user.email },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: 'Invalid input', errors: error.errors });
            return;
        }
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password, rememberMe, anonymousId } = UserLoginInputSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const isValidPassword = await argon2.verify(user.hashedPassword, password);
        if (!isValidPassword) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Associate any past anonymous games if an anonymousId is provided
        if (anonymousId) {
            await associateAnonymousGames(anonymousId, user.id);
        }

        const accessToken = generateAccessToken(user);
        const refreshTokenData = await generateRefreshToken(user.id, rememberMe);

        res.status(200).json({
            accessToken,
            refreshToken: refreshTokenData.token,
            user: { id: user.id, username: user.username, email: user.email },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: 'Invalid input', errors: error.errors });
            return;
        }
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/auth/refresh-token
router.post('/refresh-token', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { token, rememberMe } = req.body; // rememberMe could be passed if client wants to extend session during refresh

    if (!token) {
        res.status(401).json({ message: 'Refresh token is required' });
        return;
    }

    try {
        const newTokens = await rotateRefreshToken(token, rememberMe);
        if (!newTokens) {
             // If rotateRefreshToken returns null, it means the refresh token was invalid, used, or family was blacklisted.
            res.status(403).json({ message: 'Invalid or expired refresh token. Please log in again.' });
            return;
        }
        res.json(newTokens);
    } catch (error) {
        console.error('Refresh token error:', error);
         // Catch any other unexpected errors from rotateRefreshToken or JWT operations
        res.status(500).json({ message: 'Could not refresh token' });
    }
});


// POST /api/auth/logout
// This route expects the refresh token in the body to blacklist its family.
// Access token invalidation is handled by its short expiry. Client should discard both.
router.post('/logout', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { refreshToken } = req.body;

    if (refreshToken) {
        try {
            const decoded = verifyRefreshToken(refreshToken);
            if (decoded) {
                // Blacklist the entire family of this refresh token
                await blacklistTokenFamily(decoded.family);
                // Also mark the specific token as used, just in case (though family blacklisting should cover it)
                 await prisma.refreshToken.updateMany({
                    where: { token: refreshToken },
                    data: { isUsed: true },
                });
            }
        } catch (error) {
            // Log error but don't prevent logout if token is already invalid
            console.warn('Error blacklisting refresh token on logout (token might be malformed or already invalid):', error);
        }
    }
    // Even if no refresh token is provided or it's invalid, logout should be "successful" on client-side
    // by discarding tokens. Server just does its best to invalidate what it can.
    res.status(200).json({ message: 'Logged out successfully' });
});


// Example of a protected route
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
        res.status(401).json({ message: "Authentication failed or user not found on request." });
        return;
    }
    res.json({ userId: user.userId, username: user.username });
});


export default router; 