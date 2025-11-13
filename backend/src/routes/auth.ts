import express from 'express';
import { body } from 'express-validator';
import authService from '../services/authService';
import { authenticate } from '../middleware/auth';
import { validate, isStrongPassword } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public (In production, should be restricted to HR/Admin)
 */
router.post(
  '/register',
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').custom((value) => {
      const result = isStrongPassword(value);
      if (!result.valid) {
        throw new Error(result.message);
      }
      return true;
    }),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('dateOfJoining').isISO8601().withMessage('Valid date of joining is required'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  })
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, req);
    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  })
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user!.id);
    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').notEmpty().withMessage('New password is required'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await authService.changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword,
      req
    );
    res.json({
      success: true,
      message: result.message,
    });
  })
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await authService.requestPasswordReset(req.body.email);
    res.json({
      success: true,
      message: result.message,
    });
  })
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  validate([
    body('resetToken').notEmpty().withMessage('Reset token is required'),
    body('newPassword').custom((value) => {
      const result = isStrongPassword(value);
      if (!result.valid) {
        throw new Error(result.message);
      }
      return true;
    }),
  ]),
  asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(
      req.body.resetToken,
      req.body.newPassword
    );
    res.json({
      success: true,
      message: result.message,
    });
  })
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address
 * @access  Private
 */
router.post(
  '/verify-email',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await authService.verifyEmail(req.user!.id);
    res.json({
      success: true,
      message: result.message,
    });
  })
);

export default router;
