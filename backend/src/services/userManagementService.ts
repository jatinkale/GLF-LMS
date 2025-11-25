// @ts-nocheck
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Request } from 'express';
import auditService from './auditService';

const prisma = new PrismaClient();

export class UserManagementService {
  // Create LMS user for an employee
  async createUserForEmployee(employeeId: string, role: Role = 'EMPLOYEE', performedBy?: string, req?: Request) {
    try {
      // Find employee
      const employee = await prisma.employee.findUnique({
        where: { employeeId }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { employeeId }
      });

      if (existingUser) {
        throw new Error('LMS user already exists for this employee');
      }

      // Check if employee is active
      if (!employee.isActive) {
        throw new Error('Cannot create LMS user for inactive employee');
      }

      // Hash default password
      const defaultPassword = await bcrypt.hash('Password-123', 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          employeeId: employee.employeeId,
          email: employee.email,
          password: defaultPassword,
          firstName: employee.firstName,
          lastName: employee.lastName,
          gender: employee.gender,
          role: role,
          isActive: true,
          emailVerified: false,
          dateOfJoining: employee.dateOfJoining,
          designation: employee.designation,
          employmentType: employee.employmentType,
          region: employee.region,
          managerId: employee.managerId,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        select: {
          employeeId: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          dateOfJoining: true,
          designation: true,
          employmentType: true,
          region: true,
          createdAt: true
        }
      });

      // Update employee's lmsUserCreated flag
      await prisma.employee.update({
        where: { employeeId },
        data: { lmsUserCreated: true }
      });

      // Get all active leave types and create balances with 0
      const allLeaveTypes = await prisma.leaveType.findMany({
        where: { isActive: true }
      });

      const currentYear = new Date().getFullYear();
      const leaveBalancePromises = allLeaveTypes.map(leaveType =>
        prisma.leaveBalance.create({
          data: {
            employeeId: employee.employeeId,
            leaveTypeCode: leaveType.leaveTypeCode,
            year: currentYear,
            allocated: 0,
            used: 0,
            pending: 0,
            available: 0,
            carriedForward: 0,
            expired: 0,
            encashed: 0
          }
        })
      );

      await Promise.all(leaveBalancePromises);

      // Audit log
      if (performedBy) {
        await auditService.logLMSUserCreated(
          user.employeeId,
          user,
          performedBy,
          req
        );
      }

      return user;
    } catch (error) {
      console.error('Error creating user for employee:', error);
      throw error;
    }
  }

  // Get user by employee ID (from employee table)
  async getUserByEmployeeId(employeeId: string) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { employeeId }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      const user = await prisma.user.findUnique({
        where: { email: employee.email },
        select: {
          employeeId: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      return user;
    } catch (error) {
      console.error('Error fetching user by employee ID:', error);
      throw error;
    }
  }

  // Reset user password to default
  async resetPassword(employeeId: string, performedBy?: string, req?: Request) {
    try {
      const user = await prisma.user.findUnique({
        where: { employeeId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const defaultPassword = await bcrypt.hash('Password-123', 12);

      await prisma.user.update({
        where: { employeeId },
        data: {
          password: defaultPassword,
          mustChangePassword: true
        }
      });

      // Audit log - always log password resets
      await auditService.logLMSUserPasswordReset(
        employeeId,
        `${user.firstName} ${user.lastName}`,
        performedBy || 'SYSTEM',
        req
      );

      return { message: 'Password reset successfully' };
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  // Enable or disable user
  async toggleUserStatus(employeeId: string, isActive: boolean, performedBy?: string, req?: Request) {
    try {
      const user = await prisma.user.findUnique({
        where: { employeeId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Save old status before updating
      const oldStatus = user.isActive;

      // If enabling user, check if the corresponding employee is active
      if (isActive) {
        const employee = await prisma.employee.findUnique({
          where: { email: user.email }
        });

        if (employee && !employee.isActive) {
          throw new Error('Cannot enable user - Employee is marked as Inactive');
        }
      }

      const updatedUser = await prisma.user.update({
        where: { employeeId },
        data: { isActive },
        select: {
          employeeId: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        }
      });

      // Audit log - always log status changes
      await auditService.logLMSUserStatusChanged(
        employeeId,
        oldStatus,
        isActive,
        performedBy || 'SYSTEM',
        req
      );

      return updatedUser;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }

  // Update user role
  async updateUserRole(employeeId: string, role: Role, performedBy?: string, req?: Request) {
    try {
      const user = await prisma.user.findUnique({
        where: { employeeId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Store old role for audit log
      const oldRole = user.role;

      const updatedUser = await prisma.user.update({
        where: { employeeId },
        data: { role },
        select: {
          employeeId: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        }
      });

      // Audit log
      if (performedBy) {
        await auditService.logLMSUserRoleChanged(
          employeeId,
          `${updatedUser.firstName} ${updatedUser.lastName}`,
          oldRole,
          role,
          performedBy,
          req
        );
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  // Delete user and reset lmsUserCreated flag
  async deleteUser(employeeId: string, performedBy?: string, req?: Request) {
    try {
      const user = await prisma.user.findUnique({
        where: { employeeId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check for dependencies before deletion

      // Check if user has subordinates (is a manager)
      const subordinates = await prisma.user.findMany({
        where: { managerEmployeeId: employeeId }
      });

      if (subordinates.length > 0) {
        throw new Error(`Cannot delete user: This user is a manager for ${subordinates.length} employee(s). Please reassign their subordinates first.`);
      }

      // Check if user has been an approver for any leave requests
      const approvals = await prisma.approval.findMany({
        where: { approverEmployeeId: employeeId },
        take: 1
      });

      if (approvals.length > 0) {
        throw new Error('Cannot delete user: This user has approval records in the system. Consider deactivating the user instead.');
      }

      // Check if user has leave requests
      const leaveRequests = await prisma.leaveRequest.findMany({
        where: { employeeId: employeeId },
        take: 1
      });

      if (leaveRequests.length > 0) {
        throw new Error('Cannot delete user: This user has leave request records. Consider deactivating the user instead.');
      }

      // Store user data for audit log
      const userData = {
        employeeId: user.employeeId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      };

      // Find the corresponding employee record by email
      const employee = await prisma.employee.findUnique({
        where: { email: user.email }
      });

      // Delete the user
      await prisma.user.delete({
        where: { employeeId }
      });

      // Reset lmsUserCreated flag if employee exists
      if (employee) {
        await prisma.employee.update({
          where: { employeeId: employee.employeeId },
          data: { lmsUserCreated: false }
        });
      }

      // Audit log
      if (performedBy) {
        await auditService.logLMSUserDeleted(
          employeeId,
          userData,
          performedBy,
          req
        );
      }

      return { message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

export default new UserManagementService();
