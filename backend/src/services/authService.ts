import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { generateToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { Role } from '@prisma/client';
import logger from '../utils/logger';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  departmentId?: string;
  managerEmployeeId?: string;
  role?: Role;
  dateOfJoining: Date;
  designation?: string;
  region?: 'IND' | 'US';
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  // Register new user
  async register(data: RegisterData) {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { employeeId: data.employeeId }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new AppError('Email already registered', 400);
      }
      if (existingUser.employeeId === data.employeeId) {
        throw new AppError('Employee ID already exists', 400);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        employeeId: data.employeeId,
        role: data.role || 'EMPLOYEE',
        departmentId: data.departmentId,
        managerEmployeeId: data.managerEmployeeId,
        dateOfJoining: data.dateOfJoining,
        designation: data.designation,
        region: data.region || 'IND',
        isActive: true,
      },
      select: {
        employeeId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });

    // Create notification preferences
    await prisma.notificationPreference.create({
      data: {
        employeeId: user.employeeId,
      }
    });

    logger.info('User registered successfully', { employeeId: user.employeeId, email: user.email });

    // Generate token
    const token = generateToken({
      id: user.employeeId,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    });

    return {
      user,
      token,
    };
  }

  // Login user
  async login(data: LoginData) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        employeeId: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        gender: true,
        role: true,
        region: true,
        isActive: true,
        department: {
          select: {
            id: true,
            name: true,
          }
        },
        manager: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    await prisma.user.update({
      where: { employeeId: user.employeeId },
      data: { lastLogin: new Date() }
    });

    logger.info('User logged in successfully', { employeeId: user.employeeId, email: user.email });

    // Generate token
    const token = generateToken({
      id: user.employeeId,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  // Get current user profile
  async getCurrentUser(employeeId: string) {
    const user = await prisma.user.findUnique({
      where: { employeeId },
      select: {
        employeeId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        gender: true,
        dateOfBirth: true,
        dateOfJoining: true,
        phoneNumber: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        designation: true,
        employmentType: true,
        region: true,
        profilePicture: true,
        isActive: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        manager: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  // Change password
  async changePassword(employeeId: string, currentPassword: string, newPassword: string) {
    // Get user
    const user = await prisma.user.findUnique({
      where: { employeeId },
      select: { employeeId: true, password: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { employeeId },
      data: { password: hashedPassword }
    });

    logger.info('Password changed successfully', { employeeId });

    return { message: 'Password changed successfully' };
  }

  // Request password reset
  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { employeeId: true, email: true, firstName: true }
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a password reset link will be sent' };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token
    await prisma.user.update({
      where: { employeeId: user.employeeId },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      }
    });

    logger.info('Password reset requested', { employeeId: user.employeeId, email: user.email });

    // TODO: Send email with reset link
    // await emailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      message: 'If the email exists, a password reset link will be sent',
      resetToken, // In production, don't return this
    };
  }

  // Reset password with token
  async resetPassword(resetToken: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: resetToken,
        passwordResetExpires: {
          gt: new Date(), // Token not expired
        }
      },
      select: { employeeId: true }
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await prisma.user.update({
      where: { employeeId: user.employeeId },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      }
    });

    logger.info('Password reset successfully', { employeeId: user.employeeId });

    return { message: 'Password reset successfully' };
  }

  // Verify email
  async verifyEmail(employeeId: string) {
    await prisma.user.update({
      where: { employeeId },
      data: { emailVerified: true }
    });

    logger.info('Email verified', { employeeId });

    return { message: 'Email verified successfully' };
  }
}

export default new AuthService();
