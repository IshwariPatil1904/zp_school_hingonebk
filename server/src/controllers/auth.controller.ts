import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User.model';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest, generateCsrfToken } from '../middleware/auth.middleware';
import { ENV } from '../config/env';
import { ROLE_PERMISSIONS, UserRole } from '../config/permissions';

const signToken = (id: string, role: UserRole): string => {
  return jwt.sign({ id, role }, ENV.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const sendAuthCookies = (res: Response, token: string, csrfToken: string) => {
  const isProduction = ENV.NODE_ENV === 'production';

  // Secure HTTP-Only Cookie for Authentication JWT
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  // Client-readable Cookie for CSRF Protection Header
  res.cookie('csrfToken', csrfToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

/**
 * POST /api/auth/login
 * Staff login accepting email or username with rate limiting
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, username, identifier, password } = req.body;
    const loginId = (identifier || email || username || '').toLowerCase().trim();

    if (!loginId || !password) {
      throw new AppError('Please provide both email/username and password.', 400);
    }

    // Search by either email or username
    const user = await User.findOne({
      $or: [{ email: loginId }, { username: loginId }],
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email/username or password.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact the Headmaster.', 403);
    }

    const token = signToken(user._id.toString(), user.role);
    const csrfToken = generateCsrfToken();
    sendAuthCookies(res, token, csrfToken);

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: userObj,
        permissions: ROLE_PERMISSIONS[user.role],
        csrfToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Clears authentication and CSRF cookies
 */
export const logout = (req: Request, res: Response): void => {
  res.clearCookie('token', { httpOnly: true, path: '/' });
  res.clearCookie('csrfToken', { httpOnly: false, path: '/' });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * GET /api/auth/me
 * Restores user session and computes current permissions
 */
export const getCurrentUser = (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      user: req.user,
      permissions: ROLE_PERMISSIONS[req.user.role],
    },
  });
};

/**
 * POST /api/auth/change-password
 * Allows staff to securely change their own password
 */
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Please provide both current and new password.', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long.', 400);
    }

    if (currentPassword === newPassword) {
      throw new AppError('New password must be different from current password.', 400);
    }

    const userWithPassword = await User.findById(req.user._id).select('+password');
    if (!userWithPassword || !(await userWithPassword.comparePassword(currentPassword))) {
      throw new AppError('Current password is incorrect.', 400);
    }

    userWithPassword.password = newPassword;
    await userWithPassword.save();

    // Rotate CSRF token
    const newCsrfToken = generateCsrfToken();
    res.cookie('csrfToken', newCsrfToken, {
      httpOnly: false,
      secure: ENV.NODE_ENV === 'production',
      sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Your account is secured.',
      data: { csrfToken: newCsrfToken },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/csrf-token
 * Issues or refreshes CSRF token for secure mutating operations
 */
export const getCsrfToken = (req: Request, res: Response): void => {
  const csrfToken = req.cookies?.csrfToken || generateCsrfToken();
  const isProduction = ENV.NODE_ENV === 'production';

  res.cookie('csrfToken', csrfToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.status(200).json({
    success: true,
    data: { csrfToken },
  });
};

/**
 * GET /api/auth/health
 * Service and database health check
 */
export const getHealth = (req: Request, res: Response): void => {
  const dbState = mongoose.connection.readyState;
  const dbStateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    success: true,
    service: 'Zilla Parishad Primary School Hingone BK API',
    status: 'online',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStateMap[dbState] || 'unknown',
      name: mongoose.connection.name,
      host: mongoose.connection.host,
    },
  });
};
