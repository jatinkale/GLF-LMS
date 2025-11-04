const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createLeaveBalances() {
  try {
    console.log('Starting leave balance creation for existing users...\n');

    // Get all users
    const users = await prisma.user.findMany({
      include: {
        leaveBalances: {
          include: {
            leaveType: true
          }
        }
      }
    });

    console.log(`Found ${users.length} users\n`);

    const currentYear = new Date().getFullYear();

    // Get all active leave types
    const allLeaveTypes = await prisma.leaveType.findMany({
      where: { isActive: true }
    });

    console.log(`Found ${allLeaveTypes.length} active leave types\n`);

    for (const user of users) {
      console.log(`Processing user: ${user.employeeId} (${user.email})`);

      // Get existing leave balance leave type IDs
      const existingLeaveTypeIds = user.leaveBalances.map(lb => lb.leaveTypeId);

      // Create missing leave balances with 0 allocation
      let createdCount = 0;
      for (const leaveType of allLeaveTypes) {
        if (!existingLeaveTypeIds.includes(leaveType.id)) {
          await prisma.leaveBalance.create({
            data: {
              employeeId: user.employeeId,
              leaveTypeId: leaveType.id,
              year: currentYear,
              allocated: 0,
              available: 0,
              used: 0,
              pending: 0,
              carriedForward: 0,
              expired: 0,
              encashed: 0
            }
          });
          console.log(`  ✓ Created balance for ${leaveType.code} with 0 allocation`);
          createdCount++;
        } else {
          console.log(`  - Balance already exists for ${leaveType.code}`);
        }
      }

      if (createdCount > 0) {
        console.log(`  ✅ Created ${createdCount} new leave balance(s) for ${user.employeeId}\n`);
      } else {
        console.log(`  ℹ️  All leave balances already exist for ${user.employeeId}\n`);
      }
    }

    console.log('✅ Leave balance creation completed successfully!');
  } catch (error) {
    console.error('❌ Error creating leave balances:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createLeaveBalances();
