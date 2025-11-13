import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { LeaveStatus, ApprovalStatus } from '@prisma/client';
import { calculateDays, formatReadableDate } from '../utils/dateHelper';
import emailService from './emailService';
import logger from '../utils/logger';
import { Request } from 'express';
import auditService from './auditService';

interface CreateLeaveRequestData {
  employeeId: string;
  leaveTypeCode: string;
  startDate: Date;
  endDate: Date;
  totalDays?: number;
  isHalfDay?: boolean;
  halfDayType?: string;
  startDayType?: string;
  endDayType?: string;
  reason: string;
  contactDuringLeave?: string;
  emergencyContact?: string;
  isDraft?: boolean;
}

interface UpdateLeaveRequestData {
  startDate?: Date;
  endDate?: Date;
  isHalfDay?: boolean;
  halfDayType?: string;
  reason?: string;
  contactDuringLeave?: string;
  emergencyContact?: string;
}

export class LeaveService {
  // Create leave request
  async createLeaveRequest(data: CreateLeaveRequestData, req?: Request) {
    const { employeeId, leaveTypeCode, startDate, endDate, isHalfDay, reason, isDraft } = data;

    // Get user and leave type
    const [user, leaveType] = await Promise.all([
      prisma.user.findUnique({
        where: { employeeId: employeeId },
        include: {
          manager: true,
          department: true,
        }
      }),
      prisma.leaveType.findUnique({
        where: { leaveTypeCode: leaveTypeCode },
      }),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!leaveType) {
      throw new AppError('Leave type not found', 404);
    }

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      throw new AppError('Start date must be before or equal to end date', 400);
    }

    // Use totalDays from frontend if provided (already excludes weekends), otherwise calculate
    const totalDays = data.totalDays !== undefined
      ? data.totalDays
      : calculateDays(new Date(startDate), new Date(endDate), isHalfDay);

    // Check leave balance if not draft
    if (!isDraft) {
      const currentYear = new Date().getFullYear();
      const leaveBalance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId,
          leaveTypeCode,
          year: currentYear,
        },
      });

      if (!leaveBalance) {
        throw new AppError('No leave balance found for this leave type', 400);
      }

      if (leaveBalance.available < totalDays && !leaveType.allowNegativeBalance) {
        throw new AppError(
          `Insufficient leave balance. Available: ${leaveBalance.available} days, Requested: ${totalDays} days`,
          400
        );
      }

      // Check for overlapping leave requests
      const overlappingLeaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId,
          status: {
            in: ['PENDING', 'APPROVED'],
          },
          OR: [
            {
              AND: [
                { startDate: { lte: new Date(startDate) } },
                { endDate: { gte: new Date(startDate) } },
              ],
            },
            {
              AND: [
                { startDate: { lte: new Date(endDate) } },
                { endDate: { gte: new Date(endDate) } },
              ],
            },
            {
              AND: [
                { startDate: { gte: new Date(startDate) } },
                { endDate: { lte: new Date(endDate) } },
              ],
            },
          ],
        },
      });

      if (overlappingLeaves.length > 0) {
        throw new AppError('You already have a leave request for this date range', 400);
      }
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeCode,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays,
        isHalfDay: isHalfDay || false,
        halfDayType: data.halfDayType,
        reason,
        contactDuringLeave: data.contactDuringLeave,
        emergencyContact: data.emergencyContact,
        status: isDraft ? 'DRAFT' : 'PENDING',
        isDraft: isDraft || false,
      },
      include: {
        leaveType: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
          },
        },
      },
    });

    // If not draft, create approval and update balance
    if (!isDraft) {
      // Create approval for manager
      if (user.managerEmployeeId) {
        await prisma.approval.create({
          data: {
            leaveRequestId: leaveRequest.id,
            approverEmployeeId: user.managerEmployeeId,
            level: 1,
            status: 'PENDING',
          },
        });
      }

      // Update leave balance (mark as pending)
      const currentYear = new Date().getFullYear();
      await prisma.leaveBalance.update({
        where: {
          employeeId_leaveTypeCode_year: {
            employeeId,
            leaveTypeCode,
            year: currentYear,
          },
        },
        data: {
          pending: {
            increment: totalDays,
          },
          available: {
            decrement: totalDays,
          },
        },
      });

      // Send notification to manager
      if (user.manager) {
        await emailService.sendLeaveRequestNotification(
          user.manager.email,
          `${user.firstName} ${user.lastName}`,
          leaveType.name,
          formatReadableDate(new Date(startDate)),
          formatReadableDate(new Date(endDate)),
          totalDays
        );
      }

      // Audit log
      await auditService.logLeaveApplied(
        leaveRequest.id,
        {
          employeeId,
          leaveTypeCode,
          totalDays,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
        employeeId,
        req
      );

      logger.info('Leave request created', {
        leaveRequestId: leaveRequest.id,
        employeeId,
        leaveType: leaveType.name,
      });
    }

    return leaveRequest;
  }

  // Get leave request by ID
  async getLeaveRequest(id: string, employeeId?: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        leaveType: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            level: 'asc',
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }

    // Check authorization if employeeId provided
    if (employeeId && leaveRequest.employeeId !== employeeId) {
      const user = await prisma.user.findUnique({
        where: { employeeId: employeeId },
        select: { role: true },
      });

      if (user && !['HR', 'ADMIN'].includes(user.role)) {
        throw new AppError('Unauthorized', 403);
      }
    }

    return leaveRequest;
  }

  // Get leave requests (with filters)
  async getLeaveRequests(filters: {
    employeeId?: string;
    status?: LeaveStatus;
    leaveTypeCode?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { employeeId, status, leaveTypeCode, startDate, endDate, page = 1, limit = 10 } = filters;

    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status;
    }

    if (leaveTypeCode) {
      where.leaveTypeCode = leaveTypeCode;
    }

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({ startDate: { gte: new Date(startDate) } });
      }
      if (endDate) {
        where.AND.push({ endDate: { lte: new Date(endDate) } });
      }
    }

    const [total, leaveRequests] = await Promise.all([
      prisma.leaveRequest.count({ where }),
      prisma.leaveRequest.findMany({
        where,
        include: {
          leaveType: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              employeeId: true,
              manager: {
                select: {
                  firstName: true,
                  lastName: true,
                  employeeId: true,
                },
              },
            },
          },
          approvals: {
            include: {
              approver: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: leaveRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Update leave request (only drafts)
  async updateLeaveRequest(id: string, employeeId: string, data: UpdateLeaveRequestData, req?: Request) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { leaveType: true },
    });

    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }

    if (leaveRequest.employeeId !== employeeId) {
      throw new AppError('Unauthorized', 403);
    }

    if (!leaveRequest.isDraft) {
      throw new AppError('Cannot update submitted leave request', 400);
    }

    // Capture old data for audit
    const oldData = {
      leaveTypeCode: leaveRequest.leaveTypeCode,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      totalDays: leaveRequest.totalDays,
      reason: leaveRequest.reason,
    };

    // Calculate new total days if dates changed
    let totalDays = leaveRequest.totalDays;
    if (data.startDate || data.endDate) {
      const start = data.startDate || leaveRequest.startDate;
      const end = data.endDate || leaveRequest.endDate;
      totalDays = calculateDays(new Date(start), new Date(end), data.isHalfDay);
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        ...data,
        totalDays,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: {
        leaveType: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Audit log
    await auditService.logLeaveUpdated(
      id,
      oldData,
      {
        leaveTypeCode: updated.leaveTypeCode,
        startDate: updated.startDate,
        endDate: updated.endDate,
        totalDays: updated.totalDays,
        reason: updated.reason,
      },
      employeeId,
      req
    );

    return updated;
  }

  // Submit draft leave request
  async submitDraftLeaveRequest(id: string, employeeId: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            manager: true,
          },
        },
        leaveType: true,
      },
    });

    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }

    if (leaveRequest.employeeId !== employeeId) {
      throw new AppError('Unauthorized', 403);
    }

    if (!leaveRequest.isDraft) {
      throw new AppError('Leave request is already submitted', 400);
    }

    // Check leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId,
        leaveTypeCode: leaveRequest.leaveTypeCode,
        year: currentYear,
      },
    });

    if (!leaveBalance || (leaveBalance.available < leaveRequest.totalDays && !leaveRequest.leaveType.allowNegativeBalance)) {
      throw new AppError('Insufficient leave balance', 400);
    }

    // Update leave request
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        isDraft: false,
        status: 'PENDING',
      },
    });

    // Create approval
    if (leaveRequest.user.managerEmployeeId) {
      await prisma.approval.create({
        data: {
          leaveRequestId: id,
          approverEmployeeId: leaveRequest.user.managerEmployeeId,
          level: 1,
          status: 'PENDING',
        },
      });
    }

    // Update balance
    await prisma.leaveBalance.update({
      where: {
        employeeId_leaveTypeCode_year: {
          employeeId,
          leaveTypeCode: leaveRequest.leaveTypeCode,
          year: currentYear,
        },
      },
      data: {
        pending: { increment: leaveRequest.totalDays },
        available: { decrement: leaveRequest.totalDays },
      },
    });

    // Send notification
    if (leaveRequest.user.manager) {
      await emailService.sendLeaveRequestNotification(
        leaveRequest.user.manager.email,
        `${leaveRequest.user.firstName} ${leaveRequest.user.lastName}`,
        leaveRequest.leaveType.name,
        formatReadableDate(leaveRequest.startDate),
        formatReadableDate(leaveRequest.endDate),
        leaveRequest.totalDays
      );
    }

    return updated;
  }

  // Cancel leave request
  async cancelLeaveRequest(id: string, employeeId: string, reason: string, req?: Request) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            manager: true,
          },
        },
        leaveType: true,
      },
    });

    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }

    // Get user role to check if they're an Admin
    const user = await prisma.user.findUnique({
      where: { employeeId },
      select: { role: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isAdmin = user.role === 'ADMIN';

    // Allow if user is Admin or if it's their own leave request
    if (!isAdmin && leaveRequest.employeeId !== employeeId) {
      throw new AppError('Unauthorized', 403);
    }

    if (!['PENDING', 'APPROVED'].includes(leaveRequest.status)) {
      throw new AppError('Cannot cancel this leave request', 400);
    }

    // Update leave request
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledDate: new Date(),
        remarks: reason,
      },
    });

    // Restore leave balance
    const currentYear = new Date().getFullYear();
    if (leaveRequest.status === 'PENDING') {
      await prisma.leaveBalance.update({
        where: {
          employeeId_leaveTypeCode_year: {
            employeeId: leaveRequest.employeeId,
            leaveTypeCode: leaveRequest.leaveTypeCode,
            year: currentYear,
          },
        },
        data: {
          pending: { decrement: leaveRequest.totalDays },
          available: { increment: leaveRequest.totalDays },
        },
      });
    } else if (leaveRequest.status === 'APPROVED') {
      await prisma.leaveBalance.update({
        where: {
          employeeId_leaveTypeCode_year: {
            employeeId: leaveRequest.employeeId,
            leaveTypeCode: leaveRequest.leaveTypeCode,
            year: currentYear,
          },
        },
        data: {
          used: { decrement: leaveRequest.totalDays },
          available: { increment: leaveRequest.totalDays },
        },
      });
    }

    // Send notification
    if (leaveRequest.user.manager) {
      await emailService.sendLeaveCancellationNotification(
        leaveRequest.user.manager.email,
        `${leaveRequest.user.firstName} ${leaveRequest.user.lastName}`,
        leaveRequest.leaveType.name
      );
    }

    // Audit log
    await auditService.logLeaveCancelled(
      id,
      {
        employeeId: leaveRequest.employeeId,
        leaveTypeCode: leaveRequest.leaveTypeCode,
        totalDays: leaveRequest.totalDays,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
      },
      employeeId,
      reason,
      req
    );

    logger.info('Leave request cancelled', { leaveRequestId: id, employeeId });

    return updated;
  }

  // Delete leave request (only drafts)
  async deleteLeaveRequest(id: string, employeeId: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }

    if (leaveRequest.employeeId !== employeeId) {
      throw new AppError('Unauthorized', 403);
    }

    if (!leaveRequest.isDraft) {
      throw new AppError('Cannot delete submitted leave request', 400);
    }

    await prisma.leaveRequest.delete({
      where: { id },
    });

    return { message: 'Leave request deleted successfully' };
  }
}

export default new LeaveService();
