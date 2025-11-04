import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const leaveTypeRegionMapping = {
  'BL': 'US',
  'CL': 'IND',
  'COMP': 'ALL',
  'COMPOFF': 'ALL', // Also handle COMPOFF variant
  'LWP': 'ALL',
  'ML': 'ALL',
  'PL': 'IND',
  'PTL': 'ALL',
  'PAT': 'ALL', // Also handle PAT variant of PTL
  'PTO': 'US',
  'SL': 'ALL', // Adding SL (Sick Leave) as ALL since it's common
} as const;

async function updateLeaveTypeRegions() {
  try {
    console.log('🔄 Starting leave type region update...\n');

    // Get all leave types
    const leaveTypes = await prisma.leaveType.findMany({
      select: {
        leaveTypeCode: true,
        name: true,
        region: true,
      },
    });

    console.log(`Found ${leaveTypes.length} leave types:\n`);
    leaveTypes.forEach((lt) => {
      console.log(`  - ${lt.leaveTypeCode}: ${lt.name} (Current region: ${lt.region})`);
    });

    console.log('\n🔄 Updating regions...\n');

    // Update each leave type based on the mapping
    for (const [code, region] of Object.entries(leaveTypeRegionMapping)) {
      const leaveType = leaveTypes.find((lt) => lt.leaveTypeCode === code);

      if (leaveType) {
        await prisma.leaveType.update({
          where: {
            leaveTypeCode: code,
          },
          data: {
            region: region as any,
          },
        });
        console.log(`  ✅ Updated ${code} to region: ${region}`);
      } else {
        console.log(`  ⚠️  Leave type ${code} not found in database`);
      }
    }

    console.log('\n✅ Leave type regions updated successfully!\n');

    // Display updated leave types
    const updatedLeaveTypes = await prisma.leaveType.findMany({
      select: {
        leaveTypeCode: true,
        name: true,
        region: true,
      },
      orderBy: {
        leaveTypeCode: 'asc',
      },
    });

    console.log('📋 Final leave type regions:\n');
    updatedLeaveTypes.forEach((lt) => {
      console.log(`  ${lt.leaveTypeCode.padEnd(10)} - ${lt.name.padEnd(25)} - Region: ${lt.region}`);
    });

  } catch (error) {
    console.error('❌ Error updating leave type regions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateLeaveTypeRegions()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
