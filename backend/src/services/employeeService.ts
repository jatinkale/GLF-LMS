import { PrismaClient, LMSAccess, Role } from '@prisma/client';
import xlsx from 'xlsx';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface EmployeeData {
  employeeId: string;
  firstName: string;
  lastName: string;
  gender?: string;
  email: string;
  phoneNumber?: string;
  dateOfJoining: Date;
  exitDate?: Date;
  location?: string;
  designation?: string;
  department?: string;
  employmentType?: 'FTE' | 'FTDC' | 'CONSULTANT';
  reportingManager?: string;
  reportingManagerId?: string;
  lmsAccess: LMSAccess;
  isActive: boolean;
}

interface ExcelValidationResult {
  isValid: boolean;
  errors: string[];
  data?: EmployeeData[];
}

export class EmployeeService {
  // Get all employees
  async getAllEmployees() {
    try {
      const employees = await prisma.employee.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
      return employees;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw new Error('Failed to fetch employees');
    }
  }

  // Get employee by ID
  async getEmployeeById(id: string) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      return employee;
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  }

  // Get employee by Employee ID
  async getEmployeeByEmployeeId(employeeId: string) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { employeeId }
      });
      return employee;
    } catch (error) {
      console.error('Error fetching employee by employee ID:', error);
      throw error;
    }
  }

  // Create new employee
  async createEmployee(data: EmployeeData) {
    try {
      // Check if employee ID already exists
      const existingEmployee = await prisma.employee.findUnique({
        where: { employeeId: data.employeeId }
      });

      if (existingEmployee) {
        throw new Error('Employee ID already exists');
      }

      // Check if email already exists
      const existingEmail = await prisma.employee.findUnique({
        where: { email: data.email }
      });

      if (existingEmail) {
        throw new Error('Email already exists');
      }

      const employee = await prisma.employee.create({
        data: {
          employeeId: data.employeeId,
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender || null,
          email: data.email,
          phoneNumber: data.phoneNumber || null,
          dateOfJoining: data.dateOfJoining,
          exitDate: data.exitDate || null,
          location: data.location || null,
          designation: data.designation || null,
          department: data.department || null,
          employmentType: data.employmentType || null,
          reportingManager: data.reportingManager || 'NA',
          reportingManagerId: data.reportingManagerId || 'NA',
          lmsAccess: data.lmsAccess,
          isActive: data.isActive
        }
      });

      return employee;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  // Update employee
  async updateEmployee(employeeId: string, data: Partial<EmployeeData>) {
    try {
      console.log('[UPDATE] Received data for employee update:', JSON.stringify(data, null, 2));

      const existingEmployee = await prisma.employee.findUnique({
        where: { employeeId }
      });

      if (!existingEmployee) {
        throw new Error('Employee not found');
      }

      // If email is being updated, check if new email already exists
      if (data.email && data.email !== existingEmployee.email) {
        const emailExists = await prisma.employee.findUnique({
          where: { email: data.email }
        });

        if (emailExists) {
          throw new Error('Email already exists');
        }
      }

      const employee = await prisma.employee.update({
        where: { employeeId },
        data: {
          ...(data.firstName && { firstName: data.firstName }),
          ...(data.lastName && { lastName: data.lastName }),
          ...(data.gender !== undefined && { gender: data.gender }),
          ...(data.email && { email: data.email }),
          ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
          ...(data.dateOfJoining && { dateOfJoining: data.dateOfJoining }),
          ...(data.exitDate !== undefined && { exitDate: data.exitDate }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.designation !== undefined && { designation: data.designation }),
          ...(data.department !== undefined && { department: data.department }),
          ...(data.employmentType !== undefined && { employmentType: data.employmentType || null }),
          ...(data.reportingManager !== undefined && { reportingManager: data.reportingManager || 'NA' }),
          ...(data.reportingManagerId !== undefined && { reportingManagerId: data.reportingManagerId || 'NA' }),
          ...(data.lmsAccess && { lmsAccess: data.lmsAccess }),
          ...(data.isActive !== undefined && { isActive: data.isActive })
        }
      });

      // Sync changes to corresponding LMS user if one exists
      try {
        console.log(`[SYNC] Attempting to sync employee ${employee.employeeId} to LMS user`);
        const lmsUser = await prisma.user.findUnique({
          where: { employeeId: employee.employeeId }
        });

        if (lmsUser) {
          console.log(`[SYNC] Found LMS user for ${employee.employeeId}`);

          // Map location to region
          let region: 'IND' | 'US' | undefined;
          if (data.location !== undefined) {
            const locationUpper = data.location?.toUpperCase() || '';
            console.log(`[SYNC] Processing location: "${data.location}" -> "${locationUpper}"`);
            if (locationUpper.includes('IND') || locationUpper.includes('INDIA')) {
              region = 'IND';
              console.log(`[SYNC] Mapped to region: IND`);
            } else if (locationUpper.includes('US') || locationUpper.includes('USA') || locationUpper.includes('AMERICA')) {
              region = 'US';
              console.log(`[SYNC] Mapped to region: US`);
            } else {
              console.log(`[SYNC] No region mapping found for location: ${locationUpper}`);
            }
          }

          // Map LMS Access to Role
          let role: Role | undefined;
          if (data.lmsAccess) {
            role = data.lmsAccess === 'MGR' ? 'MANAGER' : 'EMPLOYEE';
            console.log(`[SYNC] Mapped LMS Access ${data.lmsAccess} to role: ${role}`);
          }

          // Build update data
          const userUpdateData: any = {};

          if (data.firstName) userUpdateData.firstName = data.firstName;
          if (data.lastName) userUpdateData.lastName = data.lastName;
          if (data.gender !== undefined) {
            // Store gender as-is (M or F)
            userUpdateData.gender = data.gender || null;
          }
          if (data.designation !== undefined) userUpdateData.designation = data.designation;
          if (data.employmentType !== undefined) userUpdateData.employmentType = data.employmentType || 'FTE';
          if (data.phoneNumber !== undefined) userUpdateData.phoneNumber = data.phoneNumber;
          if (data.isActive !== undefined) userUpdateData.isActive = data.isActive;
          if (region) userUpdateData.region = region;
          if (role) userUpdateData.role = role;

          // Only update manager if the reporting manager has an LMS user
          if (data.reportingManagerId) {
            const managerHasLmsUser = await prisma.user.findUnique({
              where: { employeeId: data.reportingManagerId },
              select: { employeeId: true }
            });

            if (managerHasLmsUser) {
              userUpdateData.managerEmployeeId = data.reportingManagerId;
              console.log(`[SYNC] Manager ${data.reportingManagerId} has LMS user, updating managerEmployeeId`);
            } else {
              console.log(`[SYNC] Manager ${data.reportingManagerId} does not have LMS user, skipping managerEmployeeId update`);
            }
          }

          // If email changed, update it
          if (data.email && data.email !== existingEmployee.email) {
            userUpdateData.email = data.email;
          }

          console.log(`[SYNC] User update data:`, JSON.stringify(userUpdateData, null, 2));

          // Update LMS user only if there are changes
          if (Object.keys(userUpdateData).length > 0) {
            await prisma.user.update({
              where: { employeeId: employee.employeeId },
              data: userUpdateData
            });
            console.log(`[SYNC] ✓ LMS user for ${employee.employeeId} synced with employee changes`);
          } else {
            console.log(`[SYNC] No changes to sync for ${employee.employeeId}`);
          }
        } else {
          console.log(`[SYNC] No LMS user found for ${employee.employeeId}`);
        }
      } catch (userError) {
        console.error('[SYNC] Error syncing changes to LMS user:', userError);
        // Don't throw error here, just log it - employee update should succeed
      }

      return employee;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  // Delete employee
  async deleteEmployee(id: string) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      await prisma.employee.delete({
        where: { id }
      });

      return { message: 'Employee deleted successfully' };
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // Validate Excel file and extract data
  validateExcelFile(buffer: Buffer): ExcelValidationResult {
    const errors: string[] = [];
    const data: EmployeeData[] = [];

    try {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonData.length === 0) {
        errors.push('Excel file is empty');
        return { isValid: false, errors };
      }

      // Expected headers
      const expectedHeaders = [
        'Employee ID',
        'First Name',
        'Last Name',
        'Gender',
        'Email ID',
        'Phone Number',
        'Date of Joining',
        'Exit Date',
        'Location',
        'Designation',
        'Department',
        'Employment Type',
        'Reporting Manager',
        'Reporting Manager ID',
        'LMS Access',
        'Active'
      ];

      // Validate headers
      const firstRow: any = jsonData[0];
      const actualHeaders = Object.keys(firstRow);

      const missingHeaders = expectedHeaders.filter(
        (header) => !actualHeaders.includes(header)
      );

      if (missingHeaders.length > 0) {
        errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
        return { isValid: false, errors };
      }

      // Validate each row
      jsonData.forEach((row: any, index: number) => {
        const rowNumber = index + 2; // +2 because Excel is 1-indexed and first row is header

        // Mandatory field validation
        if (!row['Employee ID'] || row['Employee ID'].toString().trim() === '') {
          errors.push(`Row ${rowNumber}: Employee ID is mandatory`);
        }

        if (!row['First Name'] || row['First Name'].toString().trim() === '') {
          errors.push(`Row ${rowNumber}: First Name is mandatory`);
        }

        if (!row['Last Name'] || row['Last Name'].toString().trim() === '') {
          errors.push(`Row ${rowNumber}: Last Name is mandatory`);
        }

        if (!row['Email ID'] || row['Email ID'].toString().trim() === '') {
          errors.push(`Row ${rowNumber}: Email ID is mandatory`);
        }

        if (!row['Date of Joining'] || row['Date of Joining'].toString().trim() === '') {
          errors.push(`Row ${rowNumber}: Date of Joining is mandatory`);
        }

        if (!row['Reporting Manager'] || row['Reporting Manager'].toString().trim() === '') {
          errors.push(`Row ${rowNumber}: Reporting Manager is mandatory`);
        }

        if (!row['Reporting Manager ID'] || row['Reporting Manager ID'].toString().trim() === '') {
          errors.push(`Row ${rowNumber}: Reporting Manager ID is mandatory`);
        }

        if (row['Employment Type'] && row['Employment Type'].toString().trim() !== '') {
          const employmentTypeValue = row['Employment Type'].toString().trim().toUpperCase();
          if (employmentTypeValue !== 'FTE' && employmentTypeValue !== 'FTDC' && employmentTypeValue !== 'CONSULTANT') {
            errors.push(`Row ${rowNumber}: Employment Type must be 'FTE', 'FTDC', or 'CONSULTANT'`);
          }
        }

        if (!row['LMS Access'] || row['LMS Access'].toString().trim() === '') {
          errors.push(`Row ${rowNumber}: LMS Access is mandatory`);
        } else {
          const lmsAccessValue = row['LMS Access'].toString().trim().toUpperCase();
          if (lmsAccessValue !== 'EMP' && lmsAccessValue !== 'MGR') {
            errors.push(`Row ${rowNumber}: LMS Access must be either 'EMP' or 'MGR'`);
          }
        }

        if (!row['Active'] || row['Active'].toString().trim() === '') {
          errors.push(`Row ${rowNumber}: Active is mandatory`);
        } else {
          const activeValue = row['Active'].toString().trim().toLowerCase();
          if (activeValue !== 'yes' && activeValue !== 'no') {
            errors.push(`Row ${rowNumber}: Active must be either 'Yes' or 'No'`);
          }
        }

        // Email validation
        if (row['Email ID']) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row['Email ID'].toString().trim())) {
            errors.push(`Row ${rowNumber}: Invalid email format`);
          }
        }

        // If no errors for this row, add to data
        if (errors.length === 0) {
          const lmsAccessValue = row['LMS Access'].toString().trim().toUpperCase() as LMSAccess;
          const activeValue = row['Active'].toString().trim().toLowerCase() === 'yes';
          const employmentTypeValue = row['Employment Type'] && row['Employment Type'].toString().trim() !== ''
            ? row['Employment Type'].toString().trim().toUpperCase() as 'FTE' | 'FTDC' | 'CONSULTANT'
            : undefined;

          // Parse Date of Joining (mandatory)
          let dateOfJoining: Date;
          if (typeof row['Date of Joining'] === 'number') {
            // Excel serial date number
            dateOfJoining = xlsx.SSF.parse_date_code(row['Date of Joining']);
            dateOfJoining = new Date(dateOfJoining.y, dateOfJoining.m - 1, dateOfJoining.d);
          } else {
            dateOfJoining = new Date(row['Date of Joining']);
          }

          // Parse Exit Date (optional)
          let exitDate: Date | undefined;
          if (row['Exit Date'] && row['Exit Date'].toString().trim() !== '') {
            if (typeof row['Exit Date'] === 'number') {
              // Excel serial date number
              const parsedDate = xlsx.SSF.parse_date_code(row['Exit Date']);
              exitDate = new Date(parsedDate.y, parsedDate.m - 1, parsedDate.d);
            } else {
              exitDate = new Date(row['Exit Date']);
            }
          }

          data.push({
            employeeId: row['Employee ID'].toString().trim(),
            firstName: row['First Name'].toString().trim(),
            lastName: row['Last Name'].toString().trim(),
            gender: row['Gender'] ? row['Gender'].toString().trim() : undefined,
            email: row['Email ID'].toString().trim().toLowerCase(),
            phoneNumber: row['Phone Number'] ? row['Phone Number'].toString().trim() : undefined,
            dateOfJoining: dateOfJoining,
            exitDate: exitDate,
            location: row['Location'] ? row['Location'].toString().trim() : undefined,
            designation: row['Designation'] ? row['Designation'].toString().trim() : undefined,
            department: row['Department'] ? row['Department'].toString().trim() : undefined,
            employmentType: employmentTypeValue,
            reportingManager: row['Reporting Manager'].toString().trim(),
            reportingManagerId: row['Reporting Manager ID'].toString().trim(),
            lmsAccess: lmsAccessValue,
            isActive: activeValue
          });
        }
      });

      if (errors.length > 0) {
        return { isValid: false, errors };
      }

      return { isValid: true, errors: [], data };
    } catch (error) {
      console.error('Error validating Excel file:', error);
      errors.push('Error reading Excel file. Please ensure it is a valid Excel file.');
      return { isValid: false, errors };
    }
  }

  // Import employees from Excel
  async importEmployees(buffer: Buffer) {
    const validation = this.validateExcelFile(buffer);

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        imported: 0,
        updated: 0
      };
    }

    let importedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    if (!validation.data) {
      return {
        success: false,
        errors: ['No valid data found in Excel file'],
        imported: 0,
        updated: 0
      };
    }

    // Process each employee
    for (const employeeData of validation.data) {
      try {
        // Check if employee already exists
        const existingEmployee = await prisma.employee.findUnique({
          where: { employeeId: employeeData.employeeId }
        });

        if (existingEmployee) {
          // Update existing employee using updateEmployee method (this will sync to LMS user)
          await this.updateEmployee(existingEmployee.employeeId, {
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            gender: employeeData.gender,
            email: employeeData.email,
            phoneNumber: employeeData.phoneNumber,
            dateOfJoining: employeeData.dateOfJoining,
            exitDate: employeeData.exitDate,
            location: employeeData.location,
            designation: employeeData.designation,
            department: employeeData.department,
            employmentType: employeeData.employmentType,
            reportingManager: employeeData.reportingManager,
            reportingManagerId: employeeData.reportingManagerId,
            lmsAccess: employeeData.lmsAccess,
            isActive: employeeData.isActive
          });
          updatedCount++;
        } else {
          // Create new employee
          await prisma.employee.create({
            data: {
              employeeId: employeeData.employeeId,
              firstName: employeeData.firstName,
              lastName: employeeData.lastName,
              gender: employeeData.gender || null,
              email: employeeData.email,
              phoneNumber: employeeData.phoneNumber || null,
              dateOfJoining: employeeData.dateOfJoining,
              exitDate: employeeData.exitDate || null,
              location: employeeData.location || null,
              designation: employeeData.designation || null,
              department: employeeData.department || null,
              employmentType: employeeData.employmentType || null,
              reportingManager: employeeData.reportingManager,
              reportingManagerId: employeeData.reportingManagerId,
              lmsAccess: employeeData.lmsAccess,
              isActive: employeeData.isActive
            }
          });
          importedCount++;
        }
      } catch (error: any) {
        console.error(`Error processing employee ${employeeData.employeeId}:`, error);
        errors.push(`Employee ${employeeData.employeeId}: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      errors,
      imported: importedCount,
      updated: updatedCount
    };
  }

  // Create or update LMS users from employee records
  async createLMSUsers(employeeIds: string[]) {
    const results = {
      success: true,
      created: 0,
      updated: 0,
      errors: [] as string[]
    };

    const defaultPassword = await bcrypt.hash('Password-123', 12);

    for (const employeeId of employeeIds) {
      try {
        // Get employee record
        const employee = await prisma.employee.findUnique({
          where: { employeeId: employeeId }
        });

        if (!employee) {
          results.errors.push(`Employee with ID ${employeeId} not found`);
          continue;
        }

        // Check if user already exists with this email
        const existingUser = await prisma.user.findUnique({
          where: { email: employee.email }
        });

        // Determine role based on LMS Access
        const role: Role = employee.lmsAccess === 'MGR' ? 'MANAGER' : 'EMPLOYEE';

        // Check if reporting manager has LMS user account
        let managerEmployeeId: string | null = null;
        if (employee.reportingManagerId) {
          const managerHasLmsUser = await prisma.user.findUnique({
            where: { employeeId: employee.reportingManagerId },
            select: { employeeId: true }
          });
          if (managerHasLmsUser) {
            managerEmployeeId = employee.reportingManagerId;
          }
        }

        if (existingUser) {
          // Update existing user (including password reset to default)
          await prisma.user.update({
            where: { email: employee.email },
            data: {
              password: defaultPassword,
              firstName: employee.firstName,
              lastName: employee.lastName,
              gender: employee.gender || null,
              role: role,
              isActive: employee.isActive,
              designation: employee.designation,
              employeeId: employee.employeeId,
              phoneNumber: employee.phoneNumber,
              managerEmployeeId: managerEmployeeId,
            }
          });
          results.updated++;
        } else {
          // Create new user
          await prisma.user.create({
            data: {
              email: employee.email,
              password: defaultPassword,
              firstName: employee.firstName,
              lastName: employee.lastName,
              gender: employee.gender || null,
              employeeId: employee.employeeId,
              role: role,
              designation: employee.designation,
              phoneNumber: employee.phoneNumber,
              dateOfJoining: employee.dateOfJoining || new Date(),
              employmentType: employee.employmentType || 'FTE',
              region: employee.region || 'IND',
              isActive: employee.isActive,
              emailVerified: false,
              managerEmployeeId: managerEmployeeId,
            }
          });

          // Get all active leave types and create balances with 0
          const allLeaveTypes = await prisma.leaveType.findMany({
            where: { isActive: true }
          });

          const currentYear = new Date().getFullYear();
          const leaveBalancePromises = allLeaveTypes.map((leaveType: any) =>
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

          results.created++;
        }

        // Mark employee as LMS user created
        await prisma.employee.update({
          where: { employeeId: employeeId },
          data: { lmsUserCreated: true }
        });

      } catch (error: any) {
        console.error(`Error creating LMS user for employee ${employeeId}:`, error);
        results.errors.push(`Employee ${employeeId}: ${error.message}`);
        results.success = false;
      }
    }

    return results;
  }
}

export default new EmployeeService();
