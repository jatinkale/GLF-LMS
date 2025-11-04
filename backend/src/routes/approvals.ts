import express from 'express';
import { authenticate, isManagerOrAbove } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import prisma from '../config/database';

const router = express.Router();

/**
 * @route   GET /api/v1/approvals/team-leaves
 * @desc    Get team members with their leave statistics (for managers)
 * @access  Private (Manager/HR/Admin)
 */
router.get(
  '/team-leaves',
  authenticate,
  isManagerOrAbove,
  asyncHandler(async (req, res) => {
    const managerId = req.user!.employeeId;
    const currentYear = new Date().getFullYear();

    // Get all subordinates (team members) for this manager
    const teamMembers = await prisma.user.findMany({
      where: {
        managerEmployeeId: managerId,
        isActive: true,
      },
      select: {
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // For each team member, get their leave statistics
    const teamData = await Promise.all(
      teamMembers.map(async (member) => {
        // Get all leave requests for this member
        const leaveRequests = await prisma.leaveRequest.findMany({
          where: {
            employeeId: member.employeeId,
            createdAt: {
              gte: new Date(currentYear, 0, 1), // Start of current year
              lte: new Date(currentYear, 11, 31, 23, 59, 59), // End of current year
            },
          },
          select: {
            status: true,
            totalDays: true,
          },
        });

        // Calculate statistics
        const pendingLeaves = leaveRequests
          .filter((req) => req.status === 'PENDING')
          .reduce((sum, req) => sum + req.totalDays, 0);

        const approvedLeaves = leaveRequests
          .filter((req) => req.status === 'APPROVED')
          .reduce((sum, req) => sum + req.totalDays, 0);

        const totalLeaves = leaveRequests.reduce(
          (sum, req) => sum + req.totalDays,
          0
        );

        return {
          id: member.employeeId,
          name: `${member.firstName} ${member.lastName}`,
          email: member.email,
          pendingLeaves: Math.round(pendingLeaves),
          approvedLeaves: Math.round(approvedLeaves),
          totalLeaves: Math.round(totalLeaves),
        };
      })
    );

    res.json({
      success: true,
      data: teamData,
    });
  })
);

export default router;
