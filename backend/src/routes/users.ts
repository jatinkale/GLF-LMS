import express, { Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import userManagementService from '../services/userManagementService';

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get user by employee ID
router.get('/by-employee/:employeeId', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const user = await userManagementService.getUserByEmployeeId(employeeId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'LMS user not found for this employee'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user'
    });
  }
});

// Create LMS user for an employee
router.post('/create-for-employee', async (req: Request, res: Response) => {
  try {
    const { employeeId, role } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'employeeId is required'
      });
    }

    if (role && role !== 'EMPLOYEE' && role !== 'MANAGER') {
      return res.status(400).json({
        success: false,
        message: 'Role must be either EMPLOYEE or MANAGER'
      });
    }

    const user = await userManagementService.createUserForEmployee(employeeId, role);

    res.status(201).json({
      success: true,
      message: 'LMS user created successfully. Default password: Password-123',
      data: user
    });
  } catch (error: any) {
    console.error('Error creating LMS user:', error);

    if (error.message === 'Employee not found' ||
        error.message === 'LMS user already exists for this employee' ||
        error.message === 'Cannot create LMS user for inactive employee') {
      res.status(400).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create LMS user'
      });
    }
  }
});

// Reset user password
router.post('/:userId/reset-password', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await userManagementService.resetPassword(userId);

    res.json({
      success: true,
      message: 'Password reset successfully to Password-123'
    });
  } catch (error: any) {
    console.error('Error resetting password:', error);

    if (error.message === 'User not found') {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reset password'
      });
    }
  }
});

// Enable/Disable user
router.patch('/:userId/toggle-status', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const user = await userManagementService.toggleUserStatus(userId, isActive);

    res.json({
      success: true,
      message: `User ${isActive ? 'enabled' : 'disabled'} successfully`,
      data: user
    });
  } catch (error: any) {
    console.error('Error toggling user status:', error);

    if (error.message === 'User not found') {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update user status'
      });
    }
  }
});

// Update user role
router.patch('/:userId/role', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || (role !== 'EMPLOYEE' && role !== 'MANAGER')) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either EMPLOYEE or MANAGER'
      });
    }

    const user = await userManagementService.updateUserRole(userId, role);

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error: any) {
    console.error('Error updating user role:', error);

    if (error.message === 'User not found') {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update user role'
      });
    }
  }
});

// Delete user
router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await userManagementService.deleteUser(userId);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);

    if (error.message === 'User not found') {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete user'
      });
    }
  }
});

export default router;
