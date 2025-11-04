const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Admin details
    const adminEmail = 'jatin@golivefaster.com';
    const adminEmployeeId = 'E001';
    const adminPassword = 'Password-123';

    console.log('Creating admin user...');

    // Check if employee exists
    let employee = await prisma.employee.findUnique({
      where: { employeeId: adminEmployeeId }
    });

    if (!employee) {
      console.log('Creating employee record...');
      employee = await prisma.employee.create({
        data: {
          employeeId: adminEmployeeId,
          email: adminEmail,
          firstName: 'Jatin',
          lastName: 'Kumar',
          designation: 'Admin',
          employmentType: 'FTE',
          location: 'India',
          reportingManager: 'Self',
          reportingManagerId: 'SELF',
          lmsAccess: 'MGR',
          isActive: true,
          lmsUserCreated: true
        }
      });
      console.log('Employee created:', employee.employeeId);
    } else {
      console.log('Employee already exists:', employee.employeeId);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { employeeId: adminEmployeeId }
    });

    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        employeeId: adminEmployeeId,
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Jatin',
        lastName: 'Kumar',
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
        dateOfJoining: new Date(),
        designation: 'Admin',
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
    console.log(`Created ${allLeaveTypes.length} leave balances with 0 allocation`);

    console.log('\n✓ Admin user created successfully!');
    console.log('Email:', user.email);
    console.log('Employee ID:', user.employeeId);
    console.log('Password:', adminPassword);
    console.log('Role:', user.role);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
