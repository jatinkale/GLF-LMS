import express from 'express';
import { body, query } from 'express-validator';
import leaveService from '../services/leaveService';
import approvalService from '../services/approvalService';
import { authenticate, isManagerOrAbove } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @route   POST /api/v1/leaves
 * @desc    Create new leave request
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate([
    body('leaveTypeCode').notEmpty().withMessage('Leave type is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('reason').notEmpty().withMessage('Reason is required'),
  ]),
  asyncHandler(async (req, res) => {
    const leaveRequest = await leaveService.createLeaveRequest({
      ...req.body,
      employeeId: req.user!.employeeId,
    });

    res.status(201).json({
      success: true,
      message: 'Leave request created successfully',
      data: leaveRequest,
    });
  })
);

/**
 * @route   GET /api/v1/leaves
 * @desc    Get leave requests (filtered)
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  asyncHandler(async (req, res) => {
    const { status, leaveTypeCode, startDate, endDate, page, limit } = req.query;

    const result = await leaveService.getLeaveRequests({
      employeeId: req.user!.employeeId,
      status: status as any,
      leaveTypeCode: leaveTypeCode as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

/**
 * @route   GET /api/v1/leaves/approvals/pending
 * @desc    Get pending approvals for current user (Manager/HR)
 * @access  Private (Manager/HR/Admin)
 */
router.get(
  '/approvals/pending',
  authenticate,
  isManagerOrAbove,
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query;

    const result = await approvalService.getPendingApprovals(
      req.user!.employeeId,
      page ? parseInt(page as string) : undefined,
      limit ? parseInt(limit as string) : undefined
    );

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

/**
 * @route   GET /api/v1/leaves/approvals/history
 * @desc    Get approval history for current user
 * @access  Private (Manager/HR/Admin)
 */
router.get(
  '/approvals/history',
  authenticate,
  isManagerOrAbove,
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query;

    const result = await approvalService.getApprovalHistory(
      req.user!.employeeId,
      page ? parseInt(page as string) : undefined,
      limit ? parseInt(limit as string) : undefined
    );

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

/**
 * @route   GET /api/v1/leaves/team/members-count
 * @desc    Get count of team members (for managers)
 * @access  Private (Manager/HR/Admin)
 */
router.get(
  '/team/members-count',
  authenticate,
  isManagerOrAbove,
  asyncHandler(async (req, res) => {
    const count = await approvalService.getTeamMembersCount(req.user!.employeeId);

    res.json({
      success: true,
      data: { count },
    });
  })
);

/**
 * @route   GET /api/v1/leaves/team/all
 * @desc    Get team leave requests (for managers)
 * @access  Private (Manager/HR/Admin)
 */
router.get(
  '/team/all',
  authenticate,
  isManagerOrAbove,
  asyncHandler(async (req, res) => {
    const { status, page, limit } = req.query;

    const result = await approvalService.getTeamLeaveRequests(
      req.user!.employeeId,
      status as string,
      page ? parseInt(page as string) : undefined,
      limit ? parseInt(limit as string) : undefined
    );

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

/**
 * @route   POST /api/v1/leaves/:id/submit
 * @desc    Submit draft leave request
 * @access  Private
 */
router.post(
  '/:id/submit',
  authenticate,
  asyncHandler(async (req, res) => {
    const leaveRequest = await leaveService.submitDraftLeaveRequest(
      req.params.id,
      req.user!.employeeId
    );

    res.json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leaveRequest,
    });
  })
);

/**
 * @route   POST /api/v1/leaves/:id/cancel
 * @desc    Cancel leave request
 * @access  Private
 */
router.post(
  '/:id/cancel',
  authenticate,
  validate([
    body('reason').notEmpty().withMessage('Cancellation reason is required'),
  ]),
  asyncHandler(async (req, res) => {
    const leaveRequest = await leaveService.cancelLeaveRequest(
      req.params.id,
      req.user!.employeeId,
      req.body.reason
    );

    res.json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: leaveRequest,
    });
  })
);

/**
 * @route   POST /api/v1/leaves/:id/approve
 * @desc    Approve leave request
 * @access  Private (Manager/HR/Admin)
 */
router.post(
  '/:id/approve',
  authenticate,
  isManagerOrAbove,
  asyncHandler(async (req, res) => {
    const result = await approvalService.approveLeave(req.params.id, {
      approverEmployeeId: req.user!.employeeId,
      comments: req.body.comments,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.leaveRequest,
    });
  })
);

/**
 * @route   POST /api/v1/leaves/:id/reject
 * @desc    Reject leave request
 * @access  Private (Manager/HR/Admin)
 */
router.post(
  '/:id/reject',
  authenticate,
  isManagerOrAbove,
  validate([
    body('rejectionReason').notEmpty().withMessage('Rejection reason is required'),
  ]),
  asyncHandler(async (req, res) => {
    const result = await approvalService.rejectLeave(req.params.id, {
      approverEmployeeId: req.user!.employeeId,
      comments: req.body.comments,
      rejectionReason: req.body.rejectionReason,
    });

    res.json({
      success: true,
      message: result.message,
      data: result.leaveRequest,
    });
  })
);

/**
 * @route   GET /api/v1/leaves/:id
 * @desc    Get leave request by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const leaveRequest = await leaveService.getLeaveRequest(req.params.id, req.user!.employeeId);

    res.json({
      success: true,
      data: leaveRequest,
    });
  })
);

/**
 * @route   PUT /api/v1/leaves/:id
 * @desc    Update leave request (drafts only)
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const leaveRequest = await leaveService.updateLeaveRequest(
      req.params.id,
      req.user!.employeeId,
      req.body
    );

    res.json({
      success: true,
      message: 'Leave request updated successfully',
      data: leaveRequest,
    });
  })
);

/**
 * @route   DELETE /api/v1/leaves/:id
 * @desc    Delete leave request (drafts only)
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    await leaveService.deleteLeaveRequest(req.params.id, req.user!.employeeId);

    res.json({
      success: true,
      message: 'Leave request deleted successfully',
    });
  })
);

export default router;
