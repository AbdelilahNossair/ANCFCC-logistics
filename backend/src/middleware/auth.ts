import { Request, Response, NextFunction } from 'express';
import { StaffUser } from '../types/index.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: StaffUser;
    }
  }
}

export interface AuthRequest extends Request {
  user: StaffUser;
}

/**
 * Mock user middleware for non-authenticated system
 * Sets a default admin user for tracking purposes
 */
export const setDefaultUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Set a default user for tracking movements and operations
  req.user = {
    user_id: 1,
    username: 'system',
    first_name: 'System',
    last_name: 'Admin',
    role: 'admin',
    email: 'admin@ancfcc.ma',
    phone: '+212600000000',
    password_hash: '',
    is_active: true,
    created_at: new Date()
  };
  next();
};

/**
 * Optional authentication middleware (does nothing)
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  next();
};

/**
 * Role-based authorization middleware (bypassed)
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    next();
  };
};

/**
 * Admin only middleware (bypassed)
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  next();
};

/**
 * Manager or Admin middleware (bypassed)
 */
export const requireManager = (req: Request, res: Response, next: NextFunction): void => {
  next();
};

/**
 * Any authenticated user middleware (bypassed)
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  next();
};
