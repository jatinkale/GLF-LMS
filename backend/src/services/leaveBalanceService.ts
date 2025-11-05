import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export class LeaveBalanceService {
  // Get leave balances for a user
  async getLeaveBalances(employeeId: string, year?: number) {
    const currentYear = year || new Date().getFullYear();

    // Get user's region
    const user = await prisma.user.findUnique({
      where: { employeeId },
      select: { region: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Map user region to leave type region filter
    const userRegion = user.region === 'IND' ? 'IND' : 'US';

    const balances = await prisma.leaveBalance.findMany({
      where: {
        employeeId,
        year: currentYear,
        leaveType: {
          region: {
            in: ['ALL', userRegion],
          },
        },
      },
      include: {
        leaveType: {
          select: {
            leaveTypeCode: true,
            name: true,
            category: true,
            color: true,
            isPaid: true,
            region: true,
          },
        },
      },
      orderBy: {
        leaveType: {
          sortOrder: 'asc',
        },
      },
    });

    return balances;
  }

  // Get all active leave types for user based on region
  async getLeaveTypesForUser(employeeId: string) {
    const user = await prisma.user.findUnique({
      where: { employeeId },
      select: { region: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Map user region to leave type region filter
    const userRegion = user.region === 'IND' ? 'IND' : 'US';

    // Get leave types that match user's region or are available for ALL regions
    const leaveTypes = await prisma.leaveType.findMany({
      where: {
        isActive: true,
        region: {
          in: ['ALL', userRegion],
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return leaveTypes;
  }

  // Create or update leave balance
  async upsertLeaveBalance(
    employeeId: string,
    leaveTypeCode: string,
    year: number,
    allocated: number
  ) {
    // First, check if balance exists to calculate correct available
    const existingBalance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeCode_year: {
          employeeId,
          leaveTypeCode,
          year,
        },
      },
    });

    // Calculate the correct available balance
    // available = allocated + carriedForward - used - pending
    const calculatedAvailable = existingBalance
      ? allocated + existingBalance.carriedForward - existingBalance.used - existingBalance.pending
      : allocated;

    const balance = await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeCode_year: {
          employeeId,
          leaveTypeCode,
          year,
        },
      },
      update: {
        allocated,
        available: calculatedAvailable,
      },
      create: {
        employeeId,
        leaveTypeCode,
        year,
        allocated,
        available: allocated,
        used: 0,
        pending: 0,
        carriedForward: 0,
      },
    });

    logger.info('Leave balance upserted', { employeeId, leaveTypeCode, year, allocated });

    return balance;
  }
}

export default new LeaveBalanceService();
