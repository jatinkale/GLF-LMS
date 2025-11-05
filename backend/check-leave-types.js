const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLeaveTypes() {
  try {
    const types = await prisma.leaveType.findMany({
      select: {
        leaveTypeCode: true,
        name: true,
        category: true
      },
      orderBy: { sortOrder: 'asc' }
    });

    console.log('\n=== Leave Types in Database ===\n');
    types.forEach(t => {
      console.log(`${t.leaveTypeCode.padEnd(10)} - ${t.name} (${t.category})`);
    });
    console.log('\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeaveTypes();
