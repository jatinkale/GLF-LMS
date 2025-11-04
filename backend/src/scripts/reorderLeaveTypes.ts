import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define the new order: CL, PL, PTO, BL, COMP, ML, PTL, LWP
const leaveTypeOrder = [
  { code: 'CL', sortOrder: 1 },
  { code: 'PL', sortOrder: 2 },
  { code: 'PTO', sortOrder: 3 },
  { code: 'BL', sortOrder: 4 },
  { code: 'COMP', sortOrder: 5 },
  { code: 'ML', sortOrder: 6 },
  { code: 'PTL', sortOrder: 7 },
  { code: 'LWP', sortOrder: 8 },
];

async function reorderLeaveTypes() {
  try {
    console.log('🔄 Starting leave type reordering...\n');

    // Get current leave types
    const currentLeaveTypes = await prisma.leaveType.findMany({
      select: {
        leaveTypeCode: true,
        name: true,
        sortOrder: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    console.log('📋 Current Order:\n');
    currentLeaveTypes.forEach((lt, index) => {
      console.log(`  ${index + 1}. ${lt.leaveTypeCode} - ${lt.name} (sortOrder: ${lt.sortOrder})`);
    });

    console.log('\n🔄 Updating to new order...\n');

    // Update each leave type with new sortOrder
    for (const item of leaveTypeOrder) {
      await prisma.leaveType.update({
        where: {
          leaveTypeCode: item.code,
        },
        data: {
          sortOrder: item.sortOrder,
        },
      });
      console.log(`  ✅ Updated ${item.code} to sortOrder: ${item.sortOrder}`);
    }

    console.log('\n📋 New Order:\n');

    // Display updated order
    const updatedLeaveTypes = await prisma.leaveType.findMany({
      select: {
        leaveTypeCode: true,
        name: true,
        sortOrder: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    updatedLeaveTypes.forEach((lt, index) => {
      console.log(`  ${index + 1}. ${lt.leaveTypeCode.padEnd(6)} - ${lt.name}`);
    });

    console.log('\n✅ Leave type reordering completed successfully!\n');

  } catch (error) {
    console.error('❌ Error reordering leave types:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reordering
reorderLeaveTypes()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
