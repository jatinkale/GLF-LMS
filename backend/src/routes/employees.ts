import express, { Request, Response } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth';
import employeeService from '../services/employeeService';
import { LMSAccess } from '@prisma/client';

const router = express.Router();

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files (.xls, .xlsx) are allowed.'));
    }
  }
});

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all employees
router.get('/', async (req: Request, res: Response) => {
  try {
    const employees = await employeeService.getAllEmployees();
    res.json({
      success: true,
      data: employees
    });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch employees'
    });
  }
});

// Get employee by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const employee = await employeeService.getEmployeeById(id);

    res.json({
      success: true,
      data: employee
    });
  } catch (error: any) {
    console.error('Error fetching employee:', error);

    if (error.message === 'Employee not found') {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch employee'
      });
    }
  }
});

// Create new employee
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      employeeId,
      firstName,
      lastName,
      gender,
      email,
      phoneNumber,
      location,
      designation,
      department,
      reportingManager,
      reportingManagerId,
      lmsAccess,
      isActive
    } = req.body;

    // Validation
    if (!employeeId || !firstName || !lastName || !email || !reportingManager || !reportingManagerId || !lmsAccess) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: Employee ID, First Name, Last Name, Email ID, Reporting Manager, Reporting Manager ID, and LMS Access are mandatory'
      });
    }

    // Validate LMS Access
    if (lmsAccess !== 'EMP' && lmsAccess !== 'MGR') {
      return res.status(400).json({
        success: false,
        message: 'LMS Access must be either EMP or MGR'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const employee = await employeeService.createEmployee({
      employeeId: employeeId.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender: gender?.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber?.trim(),
      dateOfJoining: new Date(),
      location: location?.trim(),
      designation: designation?.trim(),
      department: department?.trim(),
      reportingManager: reportingManager.trim(),
      reportingManagerId: reportingManagerId.trim(),
      lmsAccess: lmsAccess as LMSAccess,
      isActive: isActive !== undefined ? isActive : true
    }, req.user!.employeeId, req);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error: any) {
    console.error('Error creating employee:', error);

    if (error.message === 'Employee ID already exists' || error.message === 'Email already exists') {
      res.status(409).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create employee'
      });
    }
  }
});

// Update employee
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      gender,
      email,
      phoneNumber,
      location,
      designation,
      department,
      employmentType,
      reportingManager,
      reportingManagerId,
      lmsAccess,
      isActive
    } = req.body;

    // Validate LMS Access if provided
    if (lmsAccess && lmsAccess !== 'EMP' && lmsAccess !== 'MGR') {
      return res.status(400).json({
        success: false,
        message: 'LMS Access must be either EMP or MGR'
      });
    }

    // Validate Employment Type if provided
    if (employmentType && employmentType !== 'FTE' && employmentType !== 'FTDC' && employmentType !== 'CONSULTANT') {
      return res.status(400).json({
        success: false,
        message: 'Employment Type must be FTE, FTDC, or CONSULTANT'
      });
    }

    // Email validation if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }

    const employee = await employeeService.updateEmployee(id, {
      ...(firstName && { firstName: firstName.trim() }),
      ...(lastName && { lastName: lastName.trim() }),
      ...(gender !== undefined && { gender: gender?.trim() }),
      ...(email && { email: email.trim().toLowerCase() }),
      ...(phoneNumber !== undefined && { phoneNumber: phoneNumber?.trim() }),
      ...(location !== undefined && { location: location?.trim() }),
      ...(designation !== undefined && { designation: designation?.trim() }),
      ...(department !== undefined && { department: department?.trim() }),
      ...(employmentType !== undefined && { employmentType: employmentType || null }),
      ...(reportingManager && { reportingManager: reportingManager.trim() }),
      ...(reportingManagerId && { reportingManagerId: reportingManagerId.trim() }),
      ...(lmsAccess && { lmsAccess: lmsAccess as LMSAccess }),
      ...(isActive !== undefined && { isActive })
    }, req.user!.employeeId, req);

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error: any) {
    console.error('Error updating employee:', error);

    if (error.message === 'Employee not found') {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else if (error.message === 'Email already exists') {
      res.status(409).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update employee'
      });
    }
  }
});

// Delete employee
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await employeeService.deleteEmployee(id, req.user!.employeeId, req);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    console.error('Error deleting employee:', error);

    if (error.message === 'Employee not found') {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete employee'
      });
    }
  }
});

// Import employees from Excel
router.post('/import/excel', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const result = await employeeService.importEmployees(req.file.buffer, req.user!.employeeId, req);

    if (result.success) {
      res.json({
        success: true,
        message: `Successfully imported ${result.imported} employees and updated ${result.updated} employees`,
        data: {
          imported: result.imported,
          updated: result.updated
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to import employees',
        errors: result.errors
      });
    }
  } catch (error: any) {
    console.error('Error importing employees:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to import employees'
    });
  }
});

// Create/Update LMS Users from selected employees
router.post('/create-lms-users', async (req: Request, res: Response) => {
  try {
    const { employeeIds } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one employee'
      });
    }

    const result = await employeeService.createLMSUsers(employeeIds, req.user!.employeeId, req);

    if (result.success) {
      res.json({
        success: true,
        message: `Successfully created ${result.created} LMS users and updated ${result.updated} existing users`,
        data: {
          created: result.created,
          updated: result.updated
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to create some LMS users',
        errors: result.errors,
        data: {
          created: result.created,
          updated: result.updated
        }
      });
    }
  } catch (error: any) {
    console.error('Error creating LMS users:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create LMS users'
    });
  }
});

// Update Employee ID (cascades to all tables)
router.put('/:oldId/update-employee-id', async (req: Request, res: Response) => {
  try {
    const { oldId } = req.params;
    const { newEmployeeId } = req.body;

    // Validation
    if (!newEmployeeId || newEmployeeId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'New Employee ID is required'
      });
    }

    const trimmedNewId = newEmployeeId.trim();

    // Check if old and new are the same
    if (oldId === trimmedNewId) {
      return res.status(400).json({
        success: false,
        message: 'New Employee ID must be different from the current ID'
      });
    }

    const result = await employeeService.updateEmployeeId(
      oldId,
      trimmedNewId,
      req.user!.employeeId,
      req
    );

    res.json({
      success: true,
      message: result.message,
      data: {
        oldEmployeeId: oldId,
        newEmployeeId: trimmedNewId
      }
    });
  } catch (error: any) {
    console.error('Error updating employee ID:', error);

    // Handle specific error messages
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else if (error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update Employee ID'
      });
    }
  }
});

export default router;
