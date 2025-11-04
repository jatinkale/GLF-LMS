const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('Starting admin setup...\n');

    // Step 1: Delete existing users and employees
    console.log('1. Cleaning up existing data...');

    // Delete all users
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`   Deleted ${deletedUsers.count} users`);

    // Delete all employees
    const deletedEmployees = await prisma.employee.deleteMany({});
    console.log(`   Deleted ${deletedEmployees.count} employees`);

    console.log('   ✓ Cleanup complete\n');

    // Step 2: Create admin user (no employee record)
    console.log('2. Creating admin user...');

    const adminEmail = 'admin@golivefaster.com';
    const adminPassword = 'Admin@123';
    const adminEmployeeId = 'ADMIN001';

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user (no employee record needed)
    const admin = await prisma.user.create({
      data: {
        employeeId: adminEmployeeId,
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
        dateOfJoining: new Date(),
        designation: 'System Administrator',
        employmentType: 'FTE',
        region: 'INDIA'
      }
    });

    // Create leave balances for admin with 0 allocation
    const allLeaveTypes = await prisma.leaveType.findMany({
      where: { isActive: true }
    });

    const currentYear = new Date().getFullYear();
    for (const leaveType of allLeaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: adminEmployeeId,
          leaveTypeId: leaveType.id,
          year: currentYear,
          allocated: 0,
          available: 0,
          used: 0,
          pending: 0,
          carriedForward: 0,
          expired: 0,
          encashed: 0
        }
      });
    }

    console.log(`   ✓ Created ${allLeaveTypes.length} leave balances with 0 allocation`);

    console.log('   ✓ Admin user created successfully!\n');
    console.log('=== Admin Credentials ===');
    console.log('Email:', admin.email);
    console.log('Password:', adminPassword);
    console.log('Employee ID:', admin.employeeId);
    console.log('Role:', admin.role);
    console.log('\n✓ Setup complete!');

  } catch (error) {
    console.error('Error during setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
