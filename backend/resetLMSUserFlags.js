const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetLMSUserFlags() {
  try {
    console.log('Resetting lmsUserCreated flags...\n');

    // Get current status
    const employeesBefore = await prisma.employee.findMany({
      select: {
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        lmsUserCreated: true,
      }
    });

    console.log('Employees before reset:');
    employeesBefore.forEach(emp => {
      console.log(`- ${emp.employeeId} (${emp.firstName} ${emp.lastName}) - LMS User Created: ${emp.lmsUserCreated}`);
    });

    // Reset all lmsUserCreated flags to false
    const result = await prisma.employee.updateMany({
      data: {
        lmsUserCreated: false
      }
    });

    console.log('\n✓ Reset lmsUserCreated flag for', result.count, 'employee(s)');

    // Get updated status
    const employeesAfter = await prisma.employee.findMany({
      select: {
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        lmsUserCreated: true,
      }
    });

    console.log('\nEmployees after reset:');
    employeesAfter.forEach(emp => {
      console.log(`- ${emp.employeeId} (${emp.firstName} ${emp.lastName}) - LMS User Created: ${emp.lmsUserCreated}`);
    });

    console.log('\n✓ Reset completed successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetLMSUserFlags();
