import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEMP001() {
  console.log('Checking EMP_001 data...\n');

  try {
    // Check employee table
    const employee = await prisma.employee.findUnique({
      where: { employeeId: 'EMP_001' }
    });

    console.log('Employee Table:');
    if (employee) {
      console.log('  Employee ID:', employee.employeeId);
      console.log('  Name:', employee.firstName, employee.lastName);
      console.log('  Email:', employee.email);
      console.log('  Location:', employee.location);
      console.log('  LMS Access:', employee.lmsAccess);
      console.log('  LMS User Created:', employee.lmsUserCreated);
    } else {
      console.log('  Employee not found!');
    }

    // Check users table
    const user = await prisma.user.findUnique({
      where: { employeeId: 'EMP_001' },
      select: {
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        region: true,
        role: true,
        designation: true,
        isActive: true
      }
    });

    console.log('\nUsers Table:');
    if (user) {
      console.log('  Employee ID:', user.employeeId);
      console.log('  Name:', user.firstName, user.lastName);
      console.log('  Email:', user.email);
      console.log('  Region:', user.region);
      console.log('  Role:', user.role);
      console.log('  Designation:', user.designation);
      console.log('  Active:', user.isActive);
    } else {
      console.log('  User not found!');
    }

  } catch (error) {
    console.error('\nError:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkEMP001()
  .then(() => {
    console.log('\n=== Check completed ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n=== Check failed ===');
    console.error(error);
    process.exit(1);
  });
