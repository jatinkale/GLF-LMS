const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLeaveTypeRegions() {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      select: {
        leaveTypeCode: true,
        name: true,
        region: true,
        category: true,
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║          Leave Types and Region Restrictions             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    leaveTypes.forEach(lt => {
      const status = lt.isActive ? '✅' : '❌';
      console.log(`${status} ${lt.leaveTypeCode.padEnd(6)} - ${lt.name.padEnd(25)} | Region: ${lt.region.padEnd(4)} | Category: ${lt.category}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('Region Values:');
    console.log('  ALL - Available to all regions');
    console.log('  IND - India only');
    console.log('  US  - United States only');
    console.log('\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeaveTypeRegions();
