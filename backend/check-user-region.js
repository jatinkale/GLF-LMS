const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { employeeId: 'Z1200' },
      select: {
        employeeId: true,
        region: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log('Z1200 User:');
    console.log(JSON.stringify(user, null, 2));

    const employee = await prisma.employee.findUnique({
      where: { employeeId: 'Z1200' },
      select: {
        employeeId: true,
        location: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log('\nZ1200 Employee:');
    console.log(JSON.stringify(employee, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
