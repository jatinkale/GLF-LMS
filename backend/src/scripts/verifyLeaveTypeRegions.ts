import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyLeaveTypeRegions() {
  try {
    console.log('🔍 Verifying leave type regions...\n');

    const leaveTypes = await prisma.leaveType.findMany({
      select: {
        leaveTypeCode: true,
        name: true,
        region: true,
        isActive: true,
      },
      orderBy: {
        leaveTypeCode: 'asc',
      },
    });

    console.log('📋 Current Leave Types with Regions:\n');
    console.log('Code'.padEnd(12) + 'Name'.padEnd(30) + 'Region'.padEnd(10) + 'Active');
    console.log('-'.repeat(60));

    leaveTypes.forEach((lt) => {
      const status = lt.isActive ? '✅' : '❌';
      console.log(
        lt.leaveTypeCode.padEnd(12) +
        lt.name.padEnd(30) +
        lt.region.padEnd(10) +
        status
      );
    });

    console.log('\n📊 Region Distribution:\n');
    const regionCounts = leaveTypes.reduce((acc, lt) => {
      acc[lt.region] = (acc[lt.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(regionCounts).forEach(([region, count]) => {
      console.log(`  ${region}: ${count} leave type(s)`);
    });

    console.log('\n✅ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error verifying leave type regions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyLeaveTypeRegions()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
