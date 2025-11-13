import express, { Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../config/database';
import leavePolicyService from '../services/leavePolicyService';
import auditService from '../services/auditService';
import { Region, EmployeeType } from '@prisma/client';

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all active employees with their leave balances
router.get('/employees-with-balances', async (req: Request, res: Response) => {
  try {
    // First, get all active leave types
    const allLeaveTypes = await prisma.leaveType.findMany({
      where: {
        isActive: true,
      },
      select: {
        leaveTypeCode: true,
        name: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    const employees = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: ['EMPLOYEE', 'MANAGER'],
        },
      },
      select: {
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        region: true,
        employmentType: true,
        isActive: true,
      },
    });

    // Fetch leave balances for all employees
    const currentYear = new Date().getFullYear();
    const employeesWithBalances = await Promise.all(
      employees.map(async (employee) => {
        const leaveBalances = await prisma.leaveBalance.findMany({
          where: {
            employeeId: employee.employeeId,
            year: currentYear,
          },
          include: {
            leaveType: {
              select: {
                name: true,
                leaveTypeCode: true,
              },
            },
          },
        });

        // Create a map of existing balances
        const balanceMap = new Map(
          leaveBalances.map((lb) => [lb.leaveType.leaveTypeCode, lb])
        );

        // Ensure all leave types are represented
        const completeBalances = allLeaveTypes.map((leaveType) => {
          const existingBalance = balanceMap.get(leaveType.leaveTypeCode);

          if (existingBalance) {
            return existingBalance;
          }

          // Return a default balance structure for missing leave types
          return {
            id: `placeholder-${employee.employeeId}-${leaveType.leaveTypeCode}`,
            year: currentYear,
            allocated: 0,
            used: 0,
            pending: 0,
            available: 0,
            carriedForward: 0,
            expired: 0,
            encashed: 0,
            leaveType: {
              name: leaveType.name,
              leaveTypeCode: leaveType.leaveTypeCode,
            },
          };
        });

        return {
          ...employee,
          location: employee.region || 'N/A',
          leaveBalances: completeBalances,
        };
      })
    );

    res.json({
      success: true,
      data: employeesWithBalances,
    });
  } catch (error: any) {
    console.error('Error fetching employees with balances:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch employees with balances',
    });
  }
});

// Get employee leave details
router.get('/employee-leaves/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    // Get employee details
    const employee = await prisma.user.findUnique({
      where: { employeeId },
      select: {
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Get all leave requests for this employee
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
      },
      include: {
        leaveType: {
          select: {
            name: true,
            leaveTypeCode: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: {
        ...employee,
        leaves,
      },
    });
  } catch (error: any) {
    console.error('Error fetching employee leave details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch employee leave details',
    });
  }
});

// Process leaves for a specific region, employment type, and month-year
router.post('/leave-policy/process', async (req: Request, res: Response) => {
  try {
    const { region, employmentType, month, year, casualLeave, privilegeLeave, plannedTimeOff, bereavementLeave } = req.body;

    // Validation
    if (!region || !employmentType || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Region, Employment Type, Month, and Year are required',
      });
    }

    if (casualLeave === undefined && privilegeLeave === undefined && plannedTimeOff === undefined && bereavementLeave === undefined) {
      return res.status(400).json({
        success: false,
        message: 'At least one leave type value is required',
      });
    }

    // Get user employeeId from request (needed for audit logging)
    const performerEmployeeId = (req as any).user?.employeeId || 'Unknown';

    const result = await leavePolicyService.processLeaves({
      region: region as Region,
      employmentType: employmentType as EmployeeType,
      month: parseInt(month),
      year: parseInt(year),
      casualLeave: casualLeave !== undefined ? parseFloat(casualLeave) : undefined,
      privilegeLeave: privilegeLeave !== undefined ? parseFloat(privilegeLeave) : undefined,
      plannedTimeOff: plannedTimeOff !== undefined ? parseFloat(plannedTimeOff) : undefined,
      bereavementLeave: bereavementLeave !== undefined ? parseFloat(bereavementLeave) : undefined,
      processedBy: performerEmployeeId,
      req: req,
    });

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    console.error('Error processing leaves:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process leaves',
    });
  }
});

// Get leave processing history
router.get('/leave-policy/history', async (req: Request, res: Response) => {
  try {
    const history = await leavePolicyService.getProcessHistory();

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('Error fetching process history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch process history',
    });
  }
});

// Check if processing exists for given criteria
router.post('/leave-policy/check-exists', async (req: Request, res: Response) => {
  try {
    const { region, employmentType, month, year } = req.body;

    if (!region || !employmentType || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Region, Employment Type, Month, and Year are required',
      });
    }

    const result = await leavePolicyService.checkProcessingExists(
      region as Region,
      employmentType as EmployeeType,
      parseInt(month),
      parseInt(year)
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error checking processing history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check processing history',
    });
  }
});

// Get processed months from audit logs for warnings
router.get('/leave-policy/processed-months', async (req: Request, res: Response) => {
  try {
    const { region, employmentType } = req.query;

    if (!region || !employmentType) {
      return res.status(400).json({
        success: false,
        message: 'Region and Employment Type are required',
      });
    }

    // Get current date info
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Calculate date range: 2 months ago to future
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const startDate = new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 1);

    // Query audit logs for bulk processing
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: 'LEAVE_BALANCE_BULK_PROCESSED',
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Filter and extract unique months
    const processedMonths = new Set<string>();

    auditLogs.forEach((log) => {
      if (log.newValues) {
        try {
          const values = typeof log.newValues === 'string' ? JSON.parse(log.newValues) : log.newValues;

          // Check if this log matches the requested region and employment type
          if (values.region === region && values.employmentType === employmentType) {
            const month = values.month;
            const year = values.year;

            // Check if this is current month, last 2 months, or future month
            const logDate = new Date(year, month - 1, 1);
            const isRelevant = logDate >= startDate || logDate > now;

            if (isRelevant) {
              processedMonths.add(`${month}-${year}`);
            }
          }
        } catch (error) {
          console.error('Error parsing audit log newValues:', error);
        }
      }
    });

    // Convert to array and sort
    const monthsArray = Array.from(processedMonths).map((monthYear) => {
      const [month, year] = monthYear.split('-').map(Number);
      return { month, year };
    });

    // Sort by year and month
    monthsArray.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    res.json({
      success: true,
      data: monthsArray,
    });
  } catch (error: any) {
    console.error('Error fetching processed months:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch processed months',
    });
  }
});

// Get all leave types (for admin dropdowns)
router.get('/leave-types-all', async (req: Request, res: Response) => {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      where: {
        isActive: true,
      },
      select: {
        leaveTypeCode: true,
        name: true,
        category: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    res.json({
      success: true,
      data: leaveTypes,
    });
  } catch (error: any) {
    console.error('Error fetching all leave types:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch leave types',
    });
  }
});

// Search employees for special leave processing
router.get('/search-employees', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const searchTerm = query.trim();

    // Search in User table for LMS users
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { employeeId: { contains: searchTerm } },
          { firstName: { contains: searchTerm } },
          { lastName: { contains: searchTerm } },
          { email: { contains: searchTerm } },
        ],
      },
      select: {
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        gender: true,
        region: true,
        manager: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      take: 10, // Limit to 10 results
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error('Error searching employees:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search employees',
    });
  }
});

// Process special leave for a specific employee
router.post('/leave-policy/process-special', async (req: Request, res: Response) => {
  try {
    const { employeeId, leaveTypeCode, numberOfLeaves, comments, action } = req.body;

    // Validation
    if (!employeeId || !leaveTypeCode || !numberOfLeaves || !action) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, Leave Type, Number of Leaves, and Action are required',
      });
    }

    if (action !== 'ADD' && action !== 'REMOVE') {
      return res.status(400).json({
        success: false,
        message: 'Action must be either ADD or REMOVE',
      });
    }

    if (!comments || !comments.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comments are required',
      });
    }

    const leaves = parseFloat(numberOfLeaves);
    if (leaves <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Number of leaves must be greater than 0',
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { employeeId },
      select: {
        employeeId: true,
        firstName: true,
        lastName: true,
        isActive: true,
        region: true,
        gender: true,
        employmentType: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Employee is not active',
      });
    }

    // Fetch leave type to check region and category restrictions
    const leaveType = await prisma.leaveType.findUnique({
      where: { leaveTypeCode },
      select: {
        leaveTypeCode: true,
        name: true,
        region: true,
        category: true,
      },
    });

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: `Leave type ${leaveTypeCode} not found`,
      });
    }

    // Gender-based leave type validation
    if (leaveTypeCode === 'ML' && user.gender !== 'F') {
      return res.status(400).json({
        success: false,
        message: `Maternity Leave (ML) can only be assigned to Female employees. Employee ${user.firstName} ${user.lastName} (${employeeId}) is ${user.gender === 'M' ? 'Male' : 'not Female'}.`,
      });
    }

    if (leaveTypeCode === 'PTL' && user.gender !== 'M') {
      return res.status(400).json({
        success: false,
        message: `Paternity Leave (PTL) can only be assigned to Male employees. Employee ${user.firstName} ${user.lastName} (${employeeId}) is ${user.gender === 'F' ? 'Female' : 'not Male'}.`,
      });
    }

    // Region-based leave type validation
    if (leaveType.region !== 'ALL') {
      if (leaveType.region === 'IND' && user.region !== 'IND') {
        return res.status(400).json({
          success: false,
          message: `${leaveType.name} (${leaveTypeCode}) can only be assigned to India-based employees. Employee ${user.firstName} ${user.lastName} (${employeeId}) is in ${user.region}.`,
        });
      }

      if (leaveType.region === 'US' && user.region !== 'US') {
        return res.status(400).json({
          success: false,
          message: `${leaveType.name} (${leaveTypeCode}) can only be assigned to US-based employees. Employee ${user.firstName} ${user.lastName} (${employeeId}) is in ${user.region}.`,
        });
      }
    }

    const currentYear = new Date().getFullYear();

    // Check if leave balance exists
    const existingBalance = await prisma.leaveBalance.findFirst({
      where: {
        employeeId: employeeId,
        leaveTypeCode: leaveTypeCode,
        year: currentYear,
      },
    });

    if (action === 'REMOVE') {
      // Check if balance exists and is sufficient
      if (!existingBalance) {
        return res.status(400).json({
          success: false,
          message: `Employee does not have any balance for ${leaveTypeCode}`,
        });
      }

      if (existingBalance.available < leaves) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. Available: ${existingBalance.available} days, Requested to remove: ${leaves} days`,
        });
      }

      // Update existing balance (decrement)
      await prisma.leaveBalance.update({
        where: { id: existingBalance.id },
        data: {
          allocated: { decrement: leaves },
          available: { decrement: leaves },
        },
      });
    } else {
      // ADD operation
      if (existingBalance) {
        // Update existing balance
        await prisma.leaveBalance.update({
          where: { id: existingBalance.id },
          data: {
            allocated: { increment: leaves },
            available: { increment: leaves },
          },
        });
      } else {
        // Create new balance
        await prisma.leaveBalance.create({
          data: {
            employeeId: employeeId,
            leaveTypeCode: leaveTypeCode,
            year: currentYear,
            allocated: leaves,
            used: 0,
            pending: 0,
            available: leaves,
            carriedForward: 0,
            expired: 0,
            encashed: 0,
          },
        });
      }
    }

    // Audit logging
    const userEmail = (req as any).user?.email || 'Unknown';
    const performerEmployeeId = (req as any).user?.employeeId || userEmail;

    if (action === 'ADD') {
      await auditService.logLeaveBalanceAllocated(
        employeeId,
        leaveTypeCode,
        currentYear,
        leaves,
        performerEmployeeId,
        req
      );
    } else {
      // For REMOVE, log as adjustment with before/after values
      const afterBalance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: employeeId,
          leaveTypeCode: leaveTypeCode,
          year: currentYear,
        },
      });

      await auditService.logLeaveBalanceAdjusted(
        employeeId,
        leaveTypeCode,
        currentYear,
        { allocated: (afterBalance?.allocated || 0) + leaves, available: (afterBalance?.available || 0) + leaves },
        { allocated: afterBalance?.allocated || 0, available: afterBalance?.available || 0 },
        performerEmployeeId,
        req
      );
    }

    // Record in history - use employee's actual region and employment type
    await prisma.leaveProcessHistory.create({
      data: {
        region: user.region || 'IND', // Use employee's region, default to IND if null
        employmentType: user.employmentType || 'FTE', // Use employee's employment type
        processMonth: new Date().getMonth() + 1,
        processYear: new Date().getFullYear(),
        leaveTypeCode: leaveTypeCode,
        daysProcessed: action === 'ADD' ? leaves : -leaves, // Negative for removal
        employeesCount: 1,
        processedBy: userEmail,
        comments: `${action}: ${comments.trim()}`,
      },
    });

    const actionText = action === 'ADD' ? 'added' : 'removed';
    res.json({
      success: true,
      message: `Successfully ${actionText} ${leaves} days of ${leaveTypeCode} ${action === 'ADD' ? 'to' : 'from'} ${user.firstName} ${user.lastName}`,
      data: {
        employeeId,
        leaveTypeCode,
        numberOfLeaves: leaves,
        action,
      },
    });
  } catch (error: any) {
    console.error('Error processing special leave:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process special leave',
    });
  }
});

// Search employees with filters for bulk operations
router.post('/search-employees-bulk', async (req: Request, res: Response) => {
  try {
    const { employeeIds, location, employmentType, gender, dateOfJoiningFrom, dateOfJoiningTo } = req.body;

    // Build where clause
    const where: any = {
      isActive: true,
      role: { not: 'ADMIN' }, // Exclude admin users from employee search
    };

    // Employee IDs filter (comma-separated or array)
    if (employeeIds && employeeIds.length > 0) {
      const ids = Array.isArray(employeeIds)
        ? employeeIds
        : employeeIds.split(',').map((id: string) => id.trim()).filter((id: string) => id);

      if (ids.length > 0) {
        where.employeeId = { in: ids };
      }
    }

    // Location filter
    if (location && location !== 'All') {
      where.region = location;
    }

    // Employment Type filter
    if (employmentType && employmentType !== 'All') {
      where.employmentType = employmentType;
    }

    // Gender filter
    if (gender && gender !== 'All') {
      where.gender = gender;
    }

    // Date of Joining range filter
    if (dateOfJoiningFrom || dateOfJoiningTo) {
      where.dateOfJoining = {};
      if (dateOfJoiningFrom) {
        where.dateOfJoining.gte = new Date(dateOfJoiningFrom);
      }
      if (dateOfJoiningTo) {
        where.dateOfJoining.lte = new Date(dateOfJoiningTo);
      }
    }

    const employees = await prisma.user.findMany({
      where,
      select: {
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        gender: true,
        region: true,
        employmentType: true,
        dateOfJoining: true,
        designation: true,
      },
      orderBy: {
        employeeId: 'asc',
      },
    });

    res.json({
      success: true,
      data: employees,
    });
  } catch (error: any) {
    console.error('Error searching employees for bulk operation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search employees',
    });
  }
});

// Process special leave for multiple employees (bulk)
router.post('/leave-policy/process-special-bulk', async (req: Request, res: Response) => {
  try {
    const { employeeIds, leaveTypeCode, numberOfLeaves, comments, action } = req.body;

    // Validation
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one employee must be selected',
      });
    }

    if (!leaveTypeCode || !numberOfLeaves || !action) {
      return res.status(400).json({
        success: false,
        message: 'Leave Type, Number of Leaves, and Action are required',
      });
    }

    if (action !== 'ADD' && action !== 'REMOVE') {
      return res.status(400).json({
        success: false,
        message: 'Action must be either ADD or REMOVE',
      });
    }

    if (!comments || !comments.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comments are required',
      });
    }

    const leaves = parseFloat(numberOfLeaves);
    if (leaves <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Number of leaves must be greater than 0',
      });
    }

    // Fetch all selected employees
    const users = await prisma.user.findMany({
      where: {
        employeeId: { in: employeeIds },
        isActive: true,
      },
      select: {
        employeeId: true,
        firstName: true,
        lastName: true,
        region: true,
        gender: true,
        employmentType: true,
      },
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active employees found with the provided IDs',
      });
    }

    // Fetch leave type to check region and category restrictions
    const leaveType = await prisma.leaveType.findUnique({
      where: { leaveTypeCode },
      select: {
        leaveTypeCode: true,
        name: true,
        region: true,
        category: true,
      },
    });

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: `Leave type ${leaveTypeCode} not found`,
      });
    }

    const currentYear = new Date().getFullYear();
    const errors: string[] = [];
    const warnings: string[] = [];
    const processed: string[] = [];

    // Process each employee
    for (const user of users) {
      try {
        // Gender-based leave type validation
        if (leaveTypeCode === 'ML' && user.gender !== 'F') {
          errors.push(`${user.firstName} ${user.lastName} (${user.employeeId}): Maternity Leave (ML) can only be assigned to Female employees`);
          continue;
        }

        if (leaveTypeCode === 'PTL' && user.gender !== 'M') {
          errors.push(`${user.firstName} ${user.lastName} (${user.employeeId}): Paternity Leave (PTL) can only be assigned to Male employees`);
          continue;
        }

        // Region-based leave type validation
        if (leaveType.region !== 'ALL') {
          if (leaveType.region === 'IND' && user.region !== 'IND') {
            errors.push(`${user.firstName} ${user.lastName} (${user.employeeId}): ${leaveType.name} (${leaveTypeCode}) can only be assigned to India-based employees`);
            continue;
          }

          if (leaveType.region === 'US' && user.region !== 'US') {
            errors.push(`${user.firstName} ${user.lastName} (${user.employeeId}): ${leaveType.name} (${leaveTypeCode}) can only be assigned to US-based employees`);
            continue;
          }
        }

        // Check if leave balance exists
        const existingBalance = await prisma.leaveBalance.findFirst({
          where: {
            employeeId: user.employeeId,
            leaveTypeCode: leaveTypeCode,
            year: currentYear,
          },
        });

        if (action === 'REMOVE') {
          // Check if balance exists and is sufficient
          if (!existingBalance || existingBalance.available === 0) {
            errors.push(`${user.firstName} ${user.lastName} (${user.employeeId}): No balance available`);
            continue;
          }

          if (existingBalance.available < leaves) {
            errors.push(`${user.firstName} ${user.lastName} (${user.employeeId}): Insufficient balance (Available: ${existingBalance.available} days)`);
            continue;
          }

          // Update existing balance (decrement)
          await prisma.leaveBalance.update({
            where: { id: existingBalance.id },
            data: {
              allocated: { decrement: leaves },
              available: { decrement: leaves },
            },
          });
        } else {
          // ADD operation
          if (existingBalance) {
            // Update existing balance
            await prisma.leaveBalance.update({
              where: { id: existingBalance.id },
              data: {
                allocated: { increment: leaves },
                available: { increment: leaves },
              },
            });
          } else {
            // Create new balance
            await prisma.leaveBalance.create({
              data: {
                employeeId: user.employeeId,
                leaveTypeCode: leaveTypeCode,
                year: currentYear,
                allocated: leaves,
                used: 0,
                pending: 0,
                available: leaves,
                carriedForward: 0,
                expired: 0,
                encashed: 0,
              },
            });
          }
        }

        processed.push(`${user.firstName} ${user.lastName} (${user.employeeId})`);

        // Audit logging for each processed employee
        const performerEmployeeId = (req as any).user?.employeeId || (req as any).user?.email || 'Unknown';
        if (action === 'ADD') {
          await auditService.logLeaveBalanceAllocated(
            user.employeeId,
            leaveTypeCode,
            currentYear,
            leaves,
            performerEmployeeId,
            req
          );
        } else {
          // For REMOVE, log as adjustment with before/after values
          const afterBalance = await prisma.leaveBalance.findFirst({
            where: {
              employeeId: user.employeeId,
              leaveTypeCode: leaveTypeCode,
              year: currentYear,
            },
          });

          await auditService.logLeaveBalanceAdjusted(
            user.employeeId,
            leaveTypeCode,
            currentYear,
            { allocated: (afterBalance?.allocated || 0) + leaves, available: (afterBalance?.available || 0) + leaves },
            { allocated: afterBalance?.allocated || 0, available: afterBalance?.available || 0 },
            performerEmployeeId,
            req
          );
        }
      } catch (err: any) {
        errors.push(`${user.firstName} ${user.lastName} (${user.employeeId}): ${err.message}`);
      }
    }

    // Record in history for bulk processing
    const userEmail = (req as any).user?.email || 'Unknown';
    await prisma.leaveProcessHistory.create({
      data: {
        region: 'IND', // For bulk, we don't specify a single region
        employmentType: 'FTE', // For bulk, we don't specify a single type
        processMonth: new Date().getMonth() + 1,
        processYear: new Date().getFullYear(),
        leaveTypeCode: leaveTypeCode,
        daysProcessed: action === 'ADD' ? leaves : -leaves,
        employeesCount: processed.length,
        processedBy: userEmail,
        comments: `BULK ${action}: ${comments.trim()} - Processed: ${processed.length}, Errors: ${errors.length}`,
      },
    });

    const actionText = action === 'ADD' ? 'added' : 'removed';
    res.json({
      success: true,
      message: `Successfully ${actionText} ${leaves} days for ${processed.length} employee(s)`,
      data: {
        processed: processed.length,
        errors: errors.length,
        warnings: warnings.length,
        details: {
          processedEmployees: processed,
          errorMessages: errors,
          warningMessages: warnings,
        },
      },
    });
  } catch (error: any) {
    console.error('Error processing bulk special leave:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process bulk special leave',
    });
  }
});

// Get all leave requests with filters (for admin approvals page)
router.get('/all-leaves', async (req: Request, res: Response) => {
  try {
    const { region, status, search } = req.query;

    // Build where clause
    const where: any = {};

    // Region filter
    if (region && region !== 'All') {
      where.user = {
        region: region as string,
      };
    }

    // Status filter
    if (status && status !== 'All') {
      where.status = status as string;
    }

    // Search filter (by employee ID or name)
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      where.user = {
        ...where.user,
        OR: [
          { employeeId: { contains: searchTerm } },
          { firstName: { contains: searchTerm } },
          { lastName: { contains: searchTerm } },
        ],
      };
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            region: true,
            manager: {
              select: {
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
          },
        },
        leaveType: {
          select: {
            name: true,
            leaveTypeCode: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: leaves,
    });
  } catch (error: any) {
    console.error('Error fetching all leaves:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch leaves',
    });
  }
});

// Get audit logs with filters
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const { userId, userName, eventType, fromDate, toDate, page = '1', limit = '50' } = req.query;

    // Build where clause
    const where: any = {};

    // User ID filter
    if (userId && typeof userId === 'string' && userId.trim()) {
      where.employeeId = { contains: userId.trim() };
    }

    // User Name filter (search in user's firstName or lastName through relation)
    if (userName && typeof userName === 'string' && userName.trim()) {
      where.user = {
        OR: [
          { firstName: { contains: userName.trim() } },
          { lastName: { contains: userName.trim() } },
        ],
      };
    }

    // Event Type filter
    if (eventType && typeof eventType === 'string' && eventType.trim()) {
      where.action = eventType.trim();
    }

    // Date range filter
    if (fromDate || toDate) {
      where.timestamp = {};
      if (fromDate) {
        where.timestamp.gte = new Date(fromDate as string);
      }
      if (toDate) {
        // Add 1 day to include the entire end date
        const endDate = new Date(toDate as string);
        endDate.setHours(23, 59, 59, 999);
        where.timestamp.lte = endDate;
      }
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [total, auditLogs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              employeeId: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
    ]);

    res.json({
      success: true,
      data: auditLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch audit logs',
    });
  }
});

// Get audit logs for export (with limit)
router.get('/audit-logs/export', async (req: Request, res: Response) => {
  try {
    const { userId, userName, eventType, fromDate, toDate } = req.query;

    // Build where clause
    const where: any = {};

    // User ID filter
    if (userId && typeof userId === 'string' && userId.trim()) {
      where.employeeId = { contains: userId.trim() };
    }

    // User Name filter
    if (userName && typeof userName === 'string' && userName.trim()) {
      where.user = {
        OR: [
          { firstName: { contains: userName.trim() } },
          { lastName: { contains: userName.trim() } },
        ],
      };
    }

    // Event Type filter
    if (eventType && typeof eventType === 'string' && eventType.trim()) {
      where.action = eventType.trim();
    }

    // Date range filter
    if (fromDate || toDate) {
      where.timestamp = {};
      if (fromDate) {
        where.timestamp.gte = new Date(fromDate as string);
      }
      if (toDate) {
        const endDate = new Date(toDate as string);
        endDate.setHours(23, 59, 59, 999);
        where.timestamp.lte = endDate;
      }
    }

    // Limit to 1500 rows if no filters applied
    const hasFilters = userId || userName || eventType || fromDate || toDate;
    const limit = hasFilters ? undefined : 1500;

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    res.json({
      success: true,
      data: auditLogs,
      totalRecords: auditLogs.length,
    });
  } catch (error: any) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export audit logs',
    });
  }
});

export default router;
