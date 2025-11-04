import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating Leave Types...\n');

  // Deactivate old leave types
  console.log('Deactivating old leave types...');
  await prisma.leaveType.updateMany({
    where: {
      leaveTypeCode: {
        in: ['SL', 'ML', 'PAT']
      }
    },
    data: {
      isActive: false
    }
  });
  console.log('✓ Deactivated SL, ML, PAT\n');

  // Add Bereavement Leave
  console.log('Adding Bereavement Leave...');
  await prisma.leaveType.upsert({
    where: { leaveTypeCode: 'BL' },
    update: {},
    create: {
      name: 'Bereavement Leave',
      leaveTypeCode: 'BL',
      category: 'SPECIAL',
      description: 'Leave for bereavement/family emergency',
      color: '#607D8B',
      isPaid: true,
      requiresApproval: true,
      minDaysNotice: 0,
      allowHalfDay: false,
      carryForwardAllowed: false,
      accrualFrequency: 'NONE',
      annualAllocation: 5,
      proRataApplicable: false,
      sortOrder: 8,
    },
  });
  console.log('✓ Added Bereavement Leave\n');

  // Add Maternity/Paternity Leave (combined)
  console.log('Adding Maternity/Paternity Leave...');
  await prisma.leaveType.upsert({
    where: { leaveTypeCode: 'MATPAT' },
    update: {},
    create: {
      name: 'Maternity/Paternity Leave',
      leaveTypeCode: 'MATPAT',
      category: 'MATERNITY',
      description: 'Maternity Leave (180 days) / Paternity Leave (15 days)',
      color: '#E91E63',
      isPaid: true,
      requiresApproval: true,
      minDaysNotice: 30,
      allowHalfDay: false,
      carryForwardAllowed: false,
      accrualFrequency: 'NONE',
      annualAllocation: 0,
      proRataApplicable: false,
      attachmentRequired: true,
      sortOrder: 9,
    },
  });
  console.log('✓ Added Maternity/Paternity Leave\n');

  // List all active leave types
  console.log('📋 Active Leave Types:');
  const activeLeaveTypes = await prisma.leaveType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  });

  activeLeaveTypes.forEach((lt, index) => {
    console.log(`${index + 1}. ${lt.name} (${lt.leaveTypeCode})`);
  });

  console.log('\n✅ Leave types updated successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
