/**
 * Admin Authentication Middleware
 * 
 * Provides JWT-based authentication for admin routes.
 * Admin passwords are stored as argon2 hashes in environment variables.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';

interface AdminAuthRequest extends Request {
  adminUser?: {
    id: string;
    role: 'admin';
  };
}

const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-default-secret-change-in-production';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$argon2id$v=19$m=65536,t=3,p=4$dummy-hash-for-development';

/**
 * Admin login endpoint
 */
export async function adminLogin(req: Request, res: Response): Promise<void> {
  try {
    const { password } = req.body;
    
    if (!password) {
      res.status(400).json({ success: false, error: 'Password required' });
      return;
    }
    
    // Verify password against stored hash
    const isValidPassword = await argon2.verify(ADMIN_PASSWORD_HASH, password);
    
    if (!isValidPassword) {
      // Log failed attempt for security monitoring
      console.warn('🚨 Failed admin login attempt from:', req.ip);
      res.status(401).json({ success: false, error: 'Invalid password' });
      return;
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: 'admin',
        role: 'admin',
        iat: Date.now()
      },
      ADMIN_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Admin login successful from:', req.ip);
    
    res.json({
      success: true,
      token,
      expiresIn: '24h'
    });
    
  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Middleware to verify admin JWT token
 */
export function requireAdminAuth(req: AdminAuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No authorization token provided' });
      return;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, ADMIN_SECRET) as any;
    
    if (!decoded || decoded.role !== 'admin') {
      res.status(401).json({ success: false, error: 'Invalid admin token' });
      return;
    }
    
    // Add admin user to request
    req.adminUser = {
      id: decoded.id,
      role: decoded.role
    };
    
    next();
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, error: 'Invalid token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token expired' });
    } else {
      console.error('Error in admin auth middleware:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

/**
 * Utility to generate password hash (for setup)
 */
export async function generatePasswordHash(password: string): Promise<string> {
  return argon2.hash(password);
}

// Export the extended Request type for use in other files
export type { AdminAuthRequest }; 
 