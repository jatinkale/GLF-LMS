const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAdminBalances() {
  try {
    console.log('Updating ADMIN001 leave balances...\n');

    // Get ADMIN001's leave balances
    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId: 'ADMIN001' },
      include: { leaveType: true }
    });

    console.log(`Found ${balances.length} leave balances for ADMIN001\n`);

    for (const balance of balances) {
      const allocation = balance.leaveType.annualAllocation || 0;

      if (balance.allocated !== allocation) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            allocated: allocation,
            available: allocation - balance.used - balance.pending
          }
        });
        console.log(`✓ Updated ${balance.leaveType.code}: ${balance.allocated} → ${allocation} days`);
      } else {
        console.log(`- ${balance.leaveType.code}: Already correct (${allocation} days)`);
      }
    }

    console.log('\n✅ ADMIN001 balances updated successfully!');
  } catch (error) {
    console.error('❌ Error updating balances:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminBalances();
