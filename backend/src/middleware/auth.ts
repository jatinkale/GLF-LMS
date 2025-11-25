import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AppError } from './errorHandler';
import prisma from '../config/database';

interface JWTPayload {
  id: string; // This contains employeeId
  email: string;
  role: Role;
  employeeId: string;
}

// Verify JWT token
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as JWTPayload;

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { employeeId: decoded.id }, // decoded.id contains employeeId
      select: {
        employeeId: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (!user.isActive) {
      throw new AppError('User account is inactive', 401);
    }

    // Attach user to request
    req.user = {
      id: user.employeeId, // For backward compatibility, id contains employeeId
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

// Check if user has required role
export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

// Check if user is manager or above
export const isManagerOrAbove = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('User not authenticated', 401));
  }

  const allowedRoles: Role[] = ['MANAGER', 'HR', 'ADMIN'];

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new AppError('Manager access required', 403)
    );
  }

  next();
};

// Check if user is HR or Admin
export const isHROrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('User not authenticated', 401));
  }

  const allowedRoles: Role[] = ['HR', 'ADMIN'];

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new AppError('HR or Admin access required', 403)
    );
  }

  next();
};

// Check if user owns the resource or is authorized
export const checkOwnershipOrRole = (resourceEmployeeId: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    const isOwner = req.user.employeeId === resourceEmployeeId;
    const isAuthorized = ['HR', 'ADMIN'].includes(req.user.role);

    if (!isOwner && !isAuthorized) {
      return next(
        new AppError('You do not have permission to access this resource', 403)
      );
    }

    next();
  };
};

// Generate JWT token
export const generateToken = (payload: JWTPayload): string => {
  const expiresIn: string = process.env.JWT_EXPIRES_IN || '7d';
  // @ts-ignore - TypeScript JWT typing issue
  return jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: expiresIn,
  });
};

// Verify and decode token without throwing error
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as JWTPayload;
  } catch (error) {
    return null;
  }
};
