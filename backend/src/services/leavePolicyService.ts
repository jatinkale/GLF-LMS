import { PrismaClient, Region, EmployeeType } from '@prisma/client';
import { Request } from 'express';
import auditService from './auditService';

const prisma = new PrismaClient();

interface ProcessLeavesInput {
  region: Region;
  employmentType: EmployeeType;
  month: number;
  year: number;
  casualLeave?: number;
  privilegeLeave?: number;
  plannedTimeOff?: number;
  bereavementLeave?: number;
  processedBy: string;
  req?: Request;
}

export class LeavePolicyService {
  // Process leaves for a specific region, employment type, and month-year
  async processLeaves(data: ProcessLeavesInput) {
    const { region, employmentType, month, year, casualLeave, privilegeLeave, plannedTimeOff, bereavementLeave, processedBy, req } = data;

    try {
      // Check if already processed for this month-year
      const existingHistory = await prisma.leaveProcessHistory.findMany({
        where: {
          region,
          employmentType,
          processMonth: month,
          processYear: year,
        },
      });

      // Get all active employees matching the criteria
      const employees = await prisma.user.findMany({
        where: {
          isActive: true,
          region: region,
          employmentType: employmentType,
        },
        select: {
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      if (employees.length === 0) {
        throw new Error('No active employees found for the selected criteria');
      }

      const currentYear = new Date().getFullYear();
      let updatedCount = 0;

      // Process Casual Leave if value > 0
      if (casualLeave > 0) {
        for (const employee of employees) {
          // Check if leave balance exists
          const existingBalance = await prisma.leaveBalance.findFirst({
            where: {
              employeeId: employee.employeeId,
              leaveTypeCode: 'CL',
              year: currentYear,
            },
          });

          if (existingBalance) {
            // Update existing balance
            await prisma.leaveBalance.update({
              where: { id: existingBalance.id },
              data: {
                allocated: { increment: casualLeave },
                available: { increment: casualLeave },
              },
            });
          } else {
            // Create new balance
            await prisma.leaveBalance.create({
              data: {
                employeeId: employee.employeeId,
                leaveTypeCode: 'CL',
                year: currentYear,
                allocated: casualLeave,
                used: 0,
                pending: 0,
                available: casualLeave,
                carriedForward: 0,
                expired: 0,
                encashed: 0,
              },
            });
          }
          updatedCount++;
        }

        // Record in history
        await prisma.leaveProcessHistory.create({
          data: {
            region,
            employmentType,
            processMonth: month,
            processYear: year,
            leaveTypeCode: 'CL',
            daysProcessed: casualLeave,
            employeesCount: employees.length,
            processedBy,
          },
        });
      }

      // Process Privilege Leave if value > 0
      if (privilegeLeave && privilegeLeave > 0) {
        for (const employee of employees) {
          // Check if leave balance exists
          const existingBalance = await prisma.leaveBalance.findFirst({
            where: {
              employeeId: employee.employeeId,
              leaveTypeCode: 'PL',
              year: currentYear,
            },
          });

          if (existingBalance) {
            // Update existing balance
            await prisma.leaveBalance.update({
              where: { id: existingBalance.id },
              data: {
                allocated: { increment: privilegeLeave },
                available: { increment: privilegeLeave },
              },
            });
          } else {
            // Create new balance
            await prisma.leaveBalance.create({
              data: {
                employeeId: employee.employeeId,
                leaveTypeCode: 'PL',
                year: currentYear,
                allocated: privilegeLeave,
                used: 0,
                pending: 0,
                available: privilegeLeave,
                carriedForward: 0,
                expired: 0,
                encashed: 0,
              },
            });
          }
        }

        // Record in history
        await prisma.leaveProcessHistory.create({
          data: {
            region,
            employmentType,
            processMonth: month,
            processYear: year,
            leaveTypeCode: 'PL',
            daysProcessed: privilegeLeave,
            employeesCount: employees.length,
            processedBy,
          },
        });
      }

      // Process Planned Time Off (US) if value > 0
      if (plannedTimeOff && plannedTimeOff > 0) {
        for (const employee of employees) {
          // Check if leave balance exists
          const existingBalance = await prisma.leaveBalance.findFirst({
            where: {
              employeeId: employee.employeeId,
              leaveTypeCode: 'PTO',
              year: currentYear,
            },
          });

          if (existingBalance) {
            // Update existing balance
            await prisma.leaveBalance.update({
              where: { id: existingBalance.id },
              data: {
                allocated: { increment: plannedTimeOff },
                available: { increment: plannedTimeOff },
              },
            });
          } else {
            // Create new balance
            await prisma.leaveBalance.create({
              data: {
                employeeId: employee.employeeId,
                leaveTypeCode: 'PTO',
                year: currentYear,
                allocated: plannedTimeOff,
                used: 0,
                pending: 0,
                available: plannedTimeOff,
                carriedForward: 0,
                expired: 0,
                encashed: 0,
              },
            });
          }
        }

        // Record in history
        await prisma.leaveProcessHistory.create({
          data: {
            region,
            employmentType,
            processMonth: month,
            processYear: year,
            leaveTypeCode: 'PTO',
            daysProcessed: plannedTimeOff,
            employeesCount: employees.length,
            processedBy,
          },
        });
      }

      // Process Bereavement Leave (US) if value > 0
      if (bereavementLeave && bereavementLeave > 0) {
        for (const employee of employees) {
          // Check if leave balance exists
          const existingBalance = await prisma.leaveBalance.findFirst({
            where: {
              employeeId: employee.employeeId,
              leaveTypeCode: 'BL',
              year: currentYear,
            },
          });

          if (existingBalance) {
            // Update existing balance
            await prisma.leaveBalance.update({
              where: { id: existingBalance.id },
              data: {
                allocated: { increment: bereavementLeave },
                available: { increment: bereavementLeave },
              },
            });
          } else {
            // Create new balance
            await prisma.leaveBalance.create({
              data: {
                employeeId: employee.employeeId,
                leaveTypeCode: 'BL',
                year: currentYear,
                allocated: bereavementLeave,
                used: 0,
                pending: 0,
                available: bereavementLeave,
                carriedForward: 0,
                expired: 0,
                encashed: 0,
              },
            });
          }
        }

        // Record in history
        await prisma.leaveProcessHistory.create({
          data: {
            region,
            employmentType,
            processMonth: month,
            processYear: year,
            leaveTypeCode: 'BL',
            daysProcessed: bereavementLeave,
            employeesCount: employees.length,
            processedBy,
          },
        });
      }

      // Audit log for bulk processing
      if (processedBy) {
        const processedLeaveTypes = [];
        if (casualLeave && casualLeave > 0) processedLeaveTypes.push(`CL: ${casualLeave} days`);
        if (privilegeLeave && privilegeLeave > 0) processedLeaveTypes.push(`PL: ${privilegeLeave} days`);
        if (plannedTimeOff && plannedTimeOff > 0) processedLeaveTypes.push(`PTO: ${plannedTimeOff} days`);
        if (bereavementLeave && bereavementLeave > 0) processedLeaveTypes.push(`BL: ${bereavementLeave} days`);

        await auditService.logLeaveBalanceBulkProcessed(
          region,
          employmentType,
          month,
          year,
          employees.length,
          processedLeaveTypes.join(', '),
          processedBy,
          req
        );
      }

      return {
        success: true,
        message: `Successfully processed leaves for ${employees.length} employees`,
        employeesProcessed: employees.length,
        casualLeave: casualLeave || 0,
        privilegeLeave: privilegeLeave || 0,
        plannedTimeOff: plannedTimeOff || 0,
        bereavementLeave: bereavementLeave || 0,
        alreadyProcessed: existingHistory.length > 0,
      };
    } catch (error) {
      console.error('Error processing leaves:', error);
      throw error;
    }
  }

  // Get processing history
  async getProcessHistory() {
    try {
      const history = await prisma.leaveProcessHistory.findMany({
        orderBy: {
          processedAt: 'desc',
        },
      });

      // Group by region, employment type, month, year
      const groupedHistory = history.reduce((acc: any[], record) => {
        const key = `${record.region}-${record.employmentType}-${record.processMonth}-${record.processYear}`;
        const existingGroup = acc.find((g) => g.key === key);

        if (existingGroup) {
          existingGroup.leaveTypes.push({
            leaveTypeCode: record.leaveTypeCode,
            daysProcessed: record.daysProcessed,
          });
        } else {
          acc.push({
            key,
            region: record.region,
            employmentType: record.employmentType,
            processMonth: record.processMonth,
            processYear: record.processYear,
            employeesCount: record.employeesCount,
            processedBy: record.processedBy,
            processedAt: record.processedAt,
            leaveTypes: [
              {
                leaveTypeCode: record.leaveTypeCode,
                daysProcessed: record.daysProcessed,
              },
            ],
          });
        }

        return acc;
      }, []);

      return groupedHistory;
    } catch (error) {
      console.error('Error fetching process history:', error);
      throw error;
    }
  }

  // Check if processing exists for given month-year
  async checkProcessingExists(region: Region, employmentType: EmployeeType, month: number, year: number) {
    try {
      const history = await prisma.leaveProcessHistory.findMany({
        where: {
          region,
          employmentType,
          processMonth: month,
          processYear: year,
        },
      });

      return {
        exists: history.length > 0,
        history,
      };
    } catch (error) {
      console.error('Error checking processing history:', error);
      throw error;
    }
  }
}

export default new LeavePolicyService();
