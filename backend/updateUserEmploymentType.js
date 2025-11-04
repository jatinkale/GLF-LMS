const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateEmploymentType() {
  try {
    // Update admin user employmentType from FULL_TIME to FTE
    const result = await prisma.$executeRawUnsafe(
      'UPDATE users SET employmentType = "FTE" WHERE employeeId = "E001"'
    );

    console.log('Updated user employmentType to FTE');
    console.log('Rows affected:', result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateEmploymentType();
