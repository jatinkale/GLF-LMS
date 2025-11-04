import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDummyData() {
  try {
    console.log('🔍 Checking for dummy data in database...\n');

    // Check for users
    const allUsers = await prisma.user.findMany({
      select: {
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    console.log(`📋 Total Users: ${allUsers.length}\n`);
    allUsers.forEach((user) => {
      console.log(`  ${user.employeeId} - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
    });

    // Check for employees (from Employee table)
    console.log('\n📋 Checking Employee table...\n');
    const allEmployees = await prisma.employee.findMany({
      select: {
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        lmsUserCreated: true,
      },
    });

    console.log(`📋 Total Employees: ${allEmployees.length}\n`);
    allEmployees.forEach((emp) => {
      console.log(`  ${emp.employeeId} - ${emp.firstName} ${emp.lastName} (${emp.email}) - LMS Created: ${emp.lmsUserCreated}`);
    });

    // Find potential dummy data (common test names)
    const dummyPatterns = ['John', 'Jane', 'Bob', 'Test', 'Demo', 'Sample', 'Dummy'];

    const potentialDummyUsers = allUsers.filter((user) =>
      dummyPatterns.some(pattern =>
        user.firstName.includes(pattern) || user.lastName.includes(pattern)
      )
    );

    const potentialDummyEmployees = allEmployees.filter((emp) =>
      dummyPatterns.some(pattern =>
        emp.firstName.includes(pattern) || emp.lastName.includes(pattern)
      )
    );

    if (potentialDummyUsers.length > 0) {
      console.log('\n⚠️  Potential dummy users found:');
      potentialDummyUsers.forEach((user) => {
        console.log(`  ${user.employeeId} - ${user.firstName} ${user.lastName}`);
      });
    }

    if (potentialDummyEmployees.length > 0) {
      console.log('\n⚠️  Potential dummy employees found:');
      potentialDummyEmployees.forEach((emp) => {
        console.log(`  ${emp.employeeId} - ${emp.firstName} ${emp.lastName}`);
      });
    }

    if (potentialDummyUsers.length === 0 && potentialDummyEmployees.length === 0) {
      console.log('\n✅ No dummy data detected in database!\n');
    }

  } catch (error) {
    console.error('❌ Error checking dummy data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDummyData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
