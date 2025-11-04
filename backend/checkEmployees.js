const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmployees() {
  try {
    const employees = await prisma.employee.findMany();
    console.log('Total employees:', employees.length);

    if (employees.length > 0) {
      console.log('\nSample employee:', JSON.stringify(employees[0], null, 2));
    } else {
      console.log('\nNo employees found in database!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployees();
