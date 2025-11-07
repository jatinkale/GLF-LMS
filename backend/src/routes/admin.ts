import express, { Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../config/database';
import leavePolicyService from '../services/leavePolicyService';
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

    // Get user email from request
    const userEmail = (req as any).user?.email || 'Unknown';

    const result = await leavePolicyService.processLeaves({
      region: region as Region,
      employmentType: employmentType as EmployeeType,
      month: parseInt(month),
      year: parseInt(year),
      casualLeave: casualLeave !== undefined ? parseFloat(casualLeave) : undefined,
      privilegeLeave: privilegeLeave !== undefined ? parseFloat(privilegeLeave) : undefined,
      plannedTimeOff: plannedTimeOff !== undefined ? parseFloat(plannedTimeOff) : undefined,
      bereavementLeave: bereavementLeave !== undefined ? parseFloat(bereavementLeave) : undefined,
      processedBy: userEmail,
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

    // Record in history - use employee's actual region and employment type
    const userEmail = (req as any).user?.email || 'Unknown';
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

    const currentYear = new Date().getFullYear();
    const errors: string[] = [];
    const warnings: string[] = [];
    const processed: string[] = [];

    // Process each employee
    for (const user of users) {
      try {
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
          { employeeId: { contains: searchTerm, mode: 'insensitive' } },
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
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
          where: {
            isActive: true,
          },
          include: {
            approver: {
              select: {
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
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

export default router;
