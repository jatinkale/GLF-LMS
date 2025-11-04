import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getFiscalYear } from '../utils/dateHelper';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create Departments
  console.log('Creating departments...');
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { leaveTypeCode: 'ENG' },
      update: {},
      create: {
        name: 'Engineering',
        leaveTypeCode: 'ENG',
        description: 'Engineering Department',
      },
    }),
    prisma.department.upsert({
      where: { leaveTypeCode: 'HR' },
      update: {},
      create: {
        name: 'Human Resources',
        leaveTypeCode: 'HR',
        description: 'HR Department',
      },
    }),
    prisma.department.upsert({
      where: { leaveTypeCode: 'FIN' },
      update: {},
      create: {
        name: 'Finance',
        leaveTypeCode: 'FIN',
        description: 'Finance Department',
      },
    }),
    prisma.department.upsert({
      where: { leaveTypeCode: 'MKT' },
      update: {},
      create: {
        name: 'Marketing',
        leaveTypeCode: 'MKT',
        description: 'Marketing Department',
      },
    }),
  ]);
  console.log(`✓ Created ${departments.length} departments\n`);

  // Create Leave Types
  console.log('Creating leave types...');
  const leaveTypes = await Promise.all([
    prisma.leaveType.upsert({
      where: { leaveTypeCode: 'CL' },
      update: {},
      create: {
        name: 'Casual Leave',
        leaveTypeCode: 'CL',
        category: 'CASUAL',
        description: 'Casual leave for personal matters',
        color: '#4CAF50',
        isPaid: true,
        requiresApproval: true,
        maxConsecutiveDays: 3,
        minDaysNotice: 1,
        allowHalfDay: true,
        carryForwardAllowed: false,
        accrualFrequency: 'MONTHLY',
        accrualRate: 0.75,
        annualAllocation: 9,
        proRataApplicable: true,
        sortOrder: 1,
      },
    }),
    prisma.leaveType.upsert({
      where: { leaveTypeCode: 'SL' },
      update: {},
      create: {
        name: 'Sick Leave',
        leaveTypeCode: 'SL',
        category: 'SICK',
        description: 'Sick leave for medical reasons',
        color: '#FF9800',
        isPaid: true,
        requiresApproval: true,
        maxConsecutiveDays: 7,
        minDaysNotice: 0,
        allowHalfDay: true,
        carryForwardAllowed: false,
        accrualFrequency: 'MONTHLY',
        accrualRate: 0.5,
        annualAllocation: 6,
        proRataApplicable: true,
        sortOrder: 2,
      },
    }),
    prisma.leaveType.upsert({
      where: { leaveTypeCode: 'PL' },
      update: {},
      create: {
        name: 'Privilege Leave',
        leaveTypeCode: 'PL',
        category: 'PRIVILEGE',
        description: 'Earned leave / Privilege leave',
        color: '#2196F3',
        isPaid: true,
        requiresApproval: true,
        minDaysNotice: 7,
        allowHalfDay: true,
        carryForwardAllowed: true,
        maxCarryForwardDays: 15,
        accrualFrequency: 'MONTHLY',
        accrualRate: 1.25,
        annualAllocation: 15,
        proRataApplicable: true,
        sortOrder: 3,
      },
    }),
    prisma.leaveType.upsert({
      where: { leaveTypeCode: 'ML' },
      update: {},
      create: {
        name: 'Maternity Leave',
        leaveTypeCode: 'ML',
        category: 'MATERNITY',
        description: 'Maternity leave (180 days)',
        color: '#E91E63',
        isPaid: true,
        requiresApproval: true,
        minDaysNotice: 30,
        allowHalfDay: false,
        carryForwardAllowed: false,
        accrualFrequency: 'NONE',
        annualAllocation: 180,
        proRataApplicable: false,
        attachmentRequired: true,
        sortOrder: 4,
      },
    }),
    prisma.leaveType.upsert({
      where: { leaveTypeCode: 'PAT' },
      update: {},
      create: {
        name: 'Paternity Leave',
        leaveTypeCode: 'PAT',
        category: 'PATERNITY',
        description: 'Paternity leave (15 days)',
        color: '#9C27B0',
        isPaid: true,
        requiresApproval: true,
        minDaysNotice: 7,
        allowHalfDay: false,
        carryForwardAllowed: false,
        accrualFrequency: 'NONE',
        annualAllocation: 15,
        proRataApplicable: false,
        sortOrder: 5,
      },
    }),
    prisma.leaveType.upsert({
      where: { leaveTypeCode: 'LWP' },
      update: {},
      create: {
        name: 'Leave Without Pay',
        leaveTypeCode: 'LWP',
        category: 'LWP',
        description: 'Unpaid leave',
        color: '#757575',
        isPaid: false,
        requiresApproval: true,
        minDaysNotice: 7,
        allowHalfDay: false,
        allowNegativeBalance: true,
        carryForwardAllowed: false,
        accrualFrequency: 'NONE',
        annualAllocation: 0,
        proRataApplicable: false,
        sortOrder: 6,
      },
    }),
    prisma.leaveType.upsert({
      where: { leaveTypeCode: 'COMPOFF' },
      update: {},
      create: {
        name: 'Comp Off',
        leaveTypeCode: 'COMPOFF',
        category: 'COMP_OFF',
        description: 'Compensatory off for working on holidays/weekends',
        color: '#00BCD4',
        isPaid: true,
        requiresApproval: true,
        minDaysNotice: 1,
        allowHalfDay: true,
        carryForwardAllowed: false,
        expiryMonths: 3,
        accrualFrequency: 'NONE',
        annualAllocation: 0,
        proRataApplicable: false,
        sortOrder: 7,
      },
    }),
    prisma.leaveType.upsert({
      where: { leaveTypeCode: 'PTO' },
      update: {},
      create: {
        name: 'Paid Time Off',
        leaveTypeCode: 'PTO',
        category: 'PTO',
        description: 'Paid time off (includes vacation and sick leave)',
        color: '#3F51B5',
        isPaid: true,
        requiresApproval: true,
        minDaysNotice: 7,
        allowHalfDay: true,
        carryForwardAllowed: false,
        accrualFrequency: 'YEARLY',
        annualAllocation: 15,
        proRataApplicable: true,
        sortOrder: 8,
      },
    }),
  ]);
  console.log(`✓ Created ${leaveTypes.length} leave types\n`);

  // Create Admin User
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@golivefaster.com' },
    update: {},
    create: {
      email: 'admin@golivefaster.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      employeeId: 'ADMIN001',
      role: 'ADMIN',
      designation: 'System Administrator',
      dateOfJoining: new Date('2024-01-01'),
      region: 'INDIA',
      departmentId: departments.find(d => d.code === 'HR')?.id,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✓ Created admin user: ${admin.email}`);
  console.log(`  Default password: Admin@123\n`);

  // Create notification preferences for admin
  await prisma.notificationPreference.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
    },
  });

  // Create leave balances for admin with 0 allocation
  console.log('Creating leave balances for admin...');
  const currentYear = getFiscalYear('INDIA');
  const adminBalances = await Promise.all(
    leaveTypes.map(async (leaveType) => {
      return prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeCode_year: {
            employeeId: admin.employeeId,
            leaveTypeCode: leaveType.leaveTypeCode,
            year: currentYear,
          },
        },
        update: {},
        create: {
          employeeId: admin.employeeId,
          leaveTypeCode: leaveType.leaveTypeCode,
          year: currentYear,
          allocated: 0,
          available: 0,
          used: 0,
          pending: 0,
          carriedForward: 0,
          expired: 0,
          encashed: 0,
          lastAccrualDate: new Date(),
        },
      });
    })
  );
  console.log(`✓ Created ${adminBalances.length} leave balances for admin\n`);

  console.log('✅ Database seeding completed successfully!\n');
  console.log('Login credentials:');
  console.log('  Admin: admin@golivefaster.com / Admin@123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
