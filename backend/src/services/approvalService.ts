import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ApprovalStatus } from '@prisma/client';
import emailService from './emailService';
import { formatReadableDate } from '../utils/dateHelper';
import logger from '../utils/logger';

interface ApproveRejectData {
  approverEmployeeId: string;
  comments?: string;
}

export class ApprovalService {
  // Get pending approvals for a user (manager/HR)
  async getPendingApprovals(approverEmployeeId: string, page: number = 1, limit: number = 10) {
    const where = {
      approverEmployeeId,
      status: 'PENDING' as ApprovalStatus,
      isActive: true,
    };

    const [total, approvals] = await Promise.all([
      prisma.approval.count({ where }),
      prisma.approval.findMany({
        where,
        include: {
          leaveRequest: {
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
            },
          },
          approver: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: approvals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get approval history for a user
  async getApprovalHistory(approverEmployeeId: string, page: number = 1, limit: number = 10) {
    const where = {
      approverEmployeeId,
      status: {
        in: ['APPROVED' as ApprovalStatus, 'REJECTED' as ApprovalStatus],
      },
    };

    const [total, approvals] = await Promise.all([
      prisma.approval.count({ where }),
      prisma.approval.findMany({
        where,
        include: {
          leaveRequest: {
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
          },
          approver: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: approvals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Approve leave request
  async approveLeave(leaveRequestId: string, data: ApproveRejectData) {
    const { approverEmployeeId, comments } = data;

    // Get approver's role
    const approver = await prisma.user.findUnique({
      where: { employeeId: approverEmployeeId },
      select: { role: true, firstName: true, lastName: true },
    });

    if (!approver) {
      throw new AppError('Approver not found', 404);
    }

    const isAdmin = approver.role === 'ADMIN';

    // Get leave request with approvals
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        leaveType: true,
        approvals: {
          where: {
            isActive: true,
          },
          orderBy: {
            level: 'asc',
          },
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
    });

    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }

    if (leaveRequest.status !== 'PENDING') {
      throw new AppError('Leave request is not pending', 400);
    }

    // Find the approval for this approver
    let approval = leaveRequest.approvals.find(
      (app) => app.approverEmployeeId === approverEmployeeId && app.status === 'PENDING'
    );

    // If Admin and no approval exists, create one
    if (!approval && isAdmin) {
      approval = await prisma.approval.create({
        data: {
          leaveRequestId,
          approverEmployeeId,
          level: 1,
          status: 'PENDING',
        },
        include: {
          approver: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }

    if (!approval) {
      throw new AppError('Approval not found or already processed', 404);
    }

    // Update approval
    await prisma.approval.update({
      where: { id: approval.id },
      data: {
        status: 'APPROVED',
        comments,
        approvedDate: new Date(),
      },
    });

    // Check if this is the final approval (all approvals at this level are approved)
    const pendingApprovals = await prisma.approval.findMany({
      where: {
        leaveRequestId,
        status: 'PENDING',
        isActive: true,
      },
    });

    if (pendingApprovals.length === 0) {
      // All approvals complete - approve leave request
      await prisma.leaveRequest.update({
        where: { id: leaveRequestId },
        data: {
          status: 'APPROVED',
          approvedDate: new Date(),
        },
      });

      // Update leave balance
      const currentYear = new Date().getFullYear();
      await prisma.leaveBalance.update({
        where: {
          employeeId_leaveTypeCode_year: {
            employeeId: leaveRequest.employeeId,
            leaveTypeCode: leaveRequest.leaveTypeCode,
            year: currentYear,
          },
        },
        data: {
          pending: {
            decrement: leaveRequest.totalDays,
          },
          used: {
            increment: leaveRequest.totalDays,
          },
        },
      });

      // Send approval notification to employee
      await emailService.sendLeaveApprovalNotification(
        leaveRequest.user.email,
        `${leaveRequest.user.firstName} ${leaveRequest.user.lastName}`,
        leaveRequest.leaveType.name,
        `${approval.approver.firstName} ${approval.approver.lastName}`
      );

      logger.info('Leave request approved', {
        leaveRequestId,
        approverEmployeeId,
      });
    }

    return {
      message: 'Leave request approved successfully',
      leaveRequest: await this.getLeaveRequestWithApprovals(leaveRequestId),
    };
  }

  // Reject leave request
  async rejectLeave(leaveRequestId: string, data: ApproveRejectData & { rejectionReason: string }) {
    const { approverEmployeeId, comments, rejectionReason } = data;

    if (!rejectionReason) {
      throw new AppError('Rejection reason is required', 400);
    }

    // Get approver's role
    const approver = await prisma.user.findUnique({
      where: { employeeId: approverEmployeeId },
      select: { role: true, firstName: true, lastName: true },
    });

    if (!approver) {
      throw new AppError('Approver not found', 404);
    }

    const isAdmin = approver.role === 'ADMIN';

    // Get leave request
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        leaveType: true,
        approvals: {
          where: {
            isActive: true,
          },
          orderBy: {
            level: 'asc',
          },
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
    });

    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }

    if (leaveRequest.status !== 'PENDING') {
      throw new AppError('Leave request is not pending', 400);
    }

    // Find the approval for this approver
    let approval = leaveRequest.approvals.find(
      (app) => app.approverEmployeeId === approverEmployeeId && app.status === 'PENDING'
    );

    // If Admin and no approval exists, create one
    if (!approval && isAdmin) {
      approval = await prisma.approval.create({
        data: {
          leaveRequestId,
          approverEmployeeId,
          level: 1,
          status: 'PENDING',
        },
        include: {
          approver: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }

    if (!approval) {
      throw new AppError('Approval not found or already processed', 404);
    }

    // Update approval
    await prisma.approval.update({
      where: { id: approval.id },
      data: {
        status: 'REJECTED',
        comments,
        rejectedDate: new Date(),
      },
    });

    // Reject leave request
    await prisma.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: 'REJECTED',
        rejectedDate: new Date(),
        rejectionReason,
      },
    });

    // Restore leave balance
    const currentYear = new Date().getFullYear();
    await prisma.leaveBalance.update({
      where: {
        employeeId_leaveTypeCode_year: {
          employeeId: leaveRequest.employeeId,
          leaveTypeCode: leaveRequest.leaveTypeCode,
          year: currentYear,
        },
      },
      data: {
        pending: {
          decrement: leaveRequest.totalDays,
        },
        available: {
          increment: leaveRequest.totalDays,
        },
      },
    });

    // Send rejection notification to employee
    await emailService.sendLeaveRejectionNotification(
      leaveRequest.user.email,
      `${leaveRequest.user.firstName} ${leaveRequest.user.lastName}`,
      leaveRequest.leaveType.name,
      `${approval.approver.firstName} ${approval.approver.lastName}`,
      rejectionReason
    );

    logger.info('Leave request rejected', {
      leaveRequestId,
      approverEmployeeId,
      reason: rejectionReason,
    });

    return {
      message: 'Leave request rejected successfully',
      leaveRequest: await this.getLeaveRequestWithApprovals(leaveRequestId),
    };
  }

  // Get count of team members for a manager
  async getTeamMembersCount(managerEmployeeId: string) {
    const count = await prisma.user.count({
      where: {
        managerEmployeeId,
        isActive: true,
      },
    });

    return count;
  }

  // Get team leave requests for a manager
  async getTeamLeaveRequests(managerEmployeeId: string, status?: string, page: number = 1, limit: number = 10) {
    // Get all subordinates (users where this manager is the reporting manager)
    const subordinates = await prisma.user.findMany({
      where: {
        managerEmployeeId,
        isActive: true,
      },
      select: {
        employeeId: true,
      },
    });

    const subordinateIds = subordinates.map((sub) => sub.employeeId);

    const where: any = {
      employeeId: {
        in: subordinateIds,
      },
    };

    if (status) {
      where.status = status;
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

  // Helper: Get leave request with approvals
  private async getLeaveRequestWithApprovals(leaveRequestId: string) {
    return prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
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
  }
}

export default new ApprovalService();
