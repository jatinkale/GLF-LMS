import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Adding 5 days to all leave balances...\n');

  const currentYear = new Date().getFullYear();

  // Get all users
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
    },
  });

  // Get all active leave types
  const allLeaveTypes = await prisma.leaveType.findMany({
    where: {
      isActive: true,
    },
  });

  console.log(`Found ${users.length} active users\n`);

  for (const user of users) {
    console.log(`Processing ${user.firstName} ${user.lastName} (${user.email})...`);

    for (const leaveType of allLeaveTypes) {
      // Skip certain leave types that shouldn't have automatic allocation
      if (['LWP', 'COMPOFF'].includes(leaveType.leaveTypeCode)) {
        continue;
      }

      // Check if balance exists
      const existingBalance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: user.employeeId,
          leaveTypeCode: leaveType.leaveTypeCode,
          year: currentYear,
        },
      });

      if (existingBalance) {
        // Update existing balance - add 5 days
        await prisma.leaveBalance.update({
          where: {
            id: existingBalance.id,
          },
          data: {
            allocated: {
              increment: 5,
            },
            available: {
              increment: 5,
            },
          },
        });
        console.log(`  ✓ Added 5 days to ${leaveType.name} (${leaveType.leaveTypeCode})`);
      } else {
        // Create new balance with 5 days
        await prisma.leaveBalance.create({
          data: {
            employeeId: user.employeeId,
            leaveTypeCode: leaveType.leaveTypeCode,
            year: currentYear,
            allocated: 5,
            available: 5,
            used: 0,
            pending: 0,
            carriedForward: 0,
          },
        });
        console.log(`  ✓ Created ${leaveType.name} (${leaveType.leaveTypeCode}) balance with 5 days`);
      }
    }
    console.log('');
  }

  console.log('✅ Leave balances updated successfully!\n');

  // Display summary
  console.log('📊 Summary:');
  const balances = await prisma.leaveBalance.findMany({
    where: {
      year: currentYear,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      leaveType: {
        select: {
          name: true,
          leaveTypeCode: true,
        },
      },
    },
  });

  console.log(`Total leave balances: ${balances.length}`);
  console.log('\nPer User:');

  for (const user of users) {
    const userBalances = balances.filter(b => b.employeeId === user.employeeId);
    const totalDays = userBalances.reduce((sum, b) => sum + b.available, 0);
    console.log(`  ${user.firstName} ${user.lastName}: ${totalDays} total days across ${userBalances.length} leave types`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
