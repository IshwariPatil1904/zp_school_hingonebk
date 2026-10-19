import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { ENV } from '../config/env';
import { User, IUser } from '../models/User.model';
import { AppError } from './error.middleware';
import { Permission, UserRole, hasPermission, ROLE_PERMISSIONS } from '../config/permissions';

export interface AuthRequest extends Request {
  user?: IUser;
  permissions?: Permission[];
}

interface JwtPayload {
  id: string;
  role: UserRole;
}

/**
 * Verifies JWT token from HTTP-only cookie or Bearer header
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      throw new AppError('The user account is inactive or no longer exists.', 401);
    }

    req.user = user;
    req.permissions = ROLE_PERMISSIONS[user.role] || [];
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid authentication credentials.', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Your session has expired. Please log in again.', 401));
    } else {
      next(error);
    }
  }
};

/**
 * RBAC Role Guard - restricts to specified roles
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied: Action requires one of [${roles.join(', ')}] roles. Your role is '${req.user.role}'.`,
          403
        )
      );
    }

    next();
  };
};

/**
 * RBAC Permission Guard - enforces granular domain permission
 */
export const requirePermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!hasPermission(req.user.role, permission)) {
      return next(
        new AppError(
          `Forbidden: Insufficient privileges for action '${permission}'. Teachers are restricted from administrative modifications.`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Login Rate Limiter (Brute-force protection)
 * 5 attempts per 15 minutes window
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // ample headroom for dev servers and automated test suites
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  statusCode: 429,
});

/**
 * CSRF Protection Middleware (Double-Submit Cookie)
 */
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Safe HTTP methods do not require CSRF token
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Exempt public endpoints where session cookies are established or refreshed
  const exemptPaths = ['/api/auth/login', '/api/auth/csrf-token'];
  if (exemptPaths.includes(req.path)) {
    return next();
  }

  const clientToken = req.headers['x-csrf-token'] as string;
  const cookieToken = req.cookies?.csrfToken;

  if (!clientToken || !cookieToken || clientToken !== cookieToken) {
    return next(new AppError('Invalid or missing CSRF token. Request rejected.', 403));
  }

  next();
};

/**
 * Generate a secure cryptographically random CSRF token
 */
export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
