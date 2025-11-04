import express from 'express';
import { query } from 'express-validator';
import leaveBalanceService from '../services/leaveBalanceService';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @route   GET /api/v1/leave-balances
 * @desc    Get leave balances for current user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  validate([
    query('year').optional().isInt({ min: 2000, max: 2100 }),
  ]),
  asyncHandler(async (req, res) => {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const balances = await leaveBalanceService.getLeaveBalances(req.user!.id, year);

    res.json({
      success: true,
      data: balances,
    });
  })
);

/**
 * @route   GET /api/v1/leave-balances/leave-types
 * @desc    Get available leave types for current user
 * @access  Private
 */
router.get(
  '/leave-types',
  authenticate,
  asyncHandler(async (req, res) => {
    const leaveTypes = await leaveBalanceService.getLeaveTypesForUser(req.user!.id);

    res.json({
      success: true,
      data: leaveTypes,
    });
  })
);

export default router;
