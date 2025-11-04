const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedLeaveTypes() {
  try {
    console.log('Starting to seed leave types...\n');

    // Step 1: Create or get India Leave Policy
    let indiaPolicy = await prisma.leavePolicy.findFirst({
      where: {
        region: 'INDIA',
        name: 'India Leave Policy'
      }
    });

    if (!indiaPolicy) {
      indiaPolicy = await prisma.leavePolicy.create({
        data: {
          name: 'India Leave Policy',
          region: 'INDIA',
          description: 'Default leave policy for India region employees',
          isActive: true
        }
      });
      console.log('✓ Created India Leave Policy');
    } else {
      console.log('✓ India Leave Policy already exists');
    }

    // Step 2: Define the 7 required leave types
    const leaveTypes = [
      {
        name: 'Casual Leave',
        code: 'CL',
        category: 'CASUAL',
        description: 'Casual leave for short-term absences',
        color: '#4CAF50',
        isPaid: true,
        requiresApproval: true,
        allowHalfDay: true,
        annualAllocation: 0, // Will be set via Leave Policy UI
        accrualFrequency: 'MONTHLY'
      },
      {
        name: 'Privilege Leave',
        code: 'PL',
        category: 'PRIVILEGE',
        description: 'Privilege leave for planned vacations',
        color: '#2196F3',
        isPaid: true,
        requiresApproval: true,
        allowHalfDay: true,
        carryForwardAllowed: true,
        maxCarryForwardDays: 15,
        annualAllocation: 0, // Will be set via Leave Policy UI
        accrualFrequency: 'MONTHLY'
      },
      {
        name: 'Paid Time Off',
        code: 'PTO',
        category: 'PTO',
        description: 'Paid time off',
        color: '#FF9800',
        isPaid: true,
        requiresApproval: true,
        allowHalfDay: true,
        annualAllocation: 0,
        accrualFrequency: 'YEARLY'
      },
      {
        name: 'Bereavement Leave',
        code: 'BL',
        category: 'SPECIAL',
        description: 'Leave for family bereavement',
        color: '#9C27B0',
        isPaid: true,
        requiresApproval: true,
        allowHalfDay: false,
        maxConsecutiveDays: 5,
        annualAllocation: 5,
        accrualFrequency: 'YEARLY'
      },
      {
        name: 'Leave Without Pay',
        code: 'LWP',
        category: 'LWP',
        description: 'Leave without pay',
        color: '#F44336',
        isPaid: false,
        requiresApproval: true,
        allowHalfDay: false,
        allowNegativeBalance: true,
        annualAllocation: 0,
        accrualFrequency: 'NONE'
      },
      {
        name: 'Compensatory Off',
        code: 'COMP',
        category: 'COMP_OFF',
        description: 'Compensatory off for extra work',
        color: '#00BCD4',
        isPaid: true,
        requiresApproval: true,
        allowHalfDay: true,
        expiryMonths: 3,
        annualAllocation: 0,
        accrualFrequency: 'NONE'
      },
      {
        name: 'Maternity Leave',
        code: 'ML',
        category: 'MATERNITY',
        description: 'Maternity leave',
        color: '#E91E63',
        isPaid: true,
        requiresApproval: true,
        allowHalfDay: false,
        annualAllocation: 180,
        accrualFrequency: 'YEARLY'
      },
      {
        name: 'Paternity Leave',
        code: 'PTL',
        category: 'PATERNITY',
        description: 'Paternity leave',
        color: '#3F51B5',
        isPaid: true,
        requiresApproval: true,
        allowHalfDay: false,
        annualAllocation: 15,
        accrualFrequency: 'YEARLY'
      }
    ];

    // Step 3: Create or update leave types
    let created = 0;
    let updated = 0;

    for (const leaveType of leaveTypes) {
      const existing = await prisma.leaveType.findFirst({
        where: {
          leavePolicyId: indiaPolicy.id,
          code: leaveType.code
        }
      });

      if (existing) {
        await prisma.leaveType.update({
          where: { id: existing.id },
          data: leaveType
        });
        console.log(`✓ Updated: ${leaveType.name}`);
        updated++;
      } else {
        await prisma.leaveType.create({
          data: {
            ...leaveType,
            leavePolicyId: indiaPolicy.id
          }
        });
        console.log(`✓ Created: ${leaveType.name}`);
        created++;
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Leave Policy: ${indiaPolicy.name} (${indiaPolicy.id})`);
    console.log(`Created: ${created} leave types`);
    console.log(`Updated: ${updated} leave types`);
    console.log(`Total: ${created + updated} leave types`);

    console.log('\n✓ Seed completed successfully!');

  } catch (error) {
    console.error('Error seeding leave types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedLeaveTypes();
