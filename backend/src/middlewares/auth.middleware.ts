import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../config/db.js';
import { Role } from '@prisma/client';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: Role;
  type?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

interface CachedUser {
  user: { id: string; email: string; role: Role; status: string };
  expiresAt: number;
}

const authenticatedUserCache = new Map<string, CachedUser>();
const USER_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export function invalidateAuthUserCache(userId?: string) {
  if (userId) {
    authenticatedUserCache.delete(userId);
  } else {
    authenticatedUserCache.clear();
  }
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Invalid token format.',
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as AuthUserPayload;

    if (decoded.type === 'refresh' || (!decoded.type && !decoded.role)) {
      res.status(401).json({
        success: false,
        message: 'Invalid token type.',
      });
      return;
    }

    let user: { id: string; email: string; role: Role; status: string } | null = null;
    const cached = authenticatedUserCache.get(decoded.id);

    if (cached && Date.now() < cached.expiresAt) {
      user = cached.user;
    } else {
      user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, status: true },
      });

      if (user) {
        authenticatedUserCache.set(decoded.id, {
          user,
          expiresAt: Date.now() + USER_CACHE_TTL_MS,
        });
      }
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        message: `Account is ${user.status.toLowerCase()}. Please contact an administrator.`,
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to perform this action.',
      });
      return;
    }

    next();
  };
};
