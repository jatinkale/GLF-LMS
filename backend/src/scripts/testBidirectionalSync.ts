import employeeService from '../services/employeeService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBidirectionalSync() {
  console.log('Testing bidirectional sync for EMP_001...\n');

  try {
    // Test 1: Update to India
    console.log('=== Test 1: Update location to India ===');
    await employeeService.updateEmployee('EMP_001', {
      location: 'India'
    });

    const user1 = await prisma.user.findUnique({
      where: { employeeId: 'EMP_001' },
      select: { region: true }
    });

    console.log(`✓ Employee location: India → User region: ${user1?.region}`);
    console.log(`  ${user1?.region === 'IND' ? '✓ PASS' : '✗ FAIL'}\n`);

    // Test 2: Update to USA
    console.log('=== Test 2: Update location to USA ===');
    await employeeService.updateEmployee('EMP_001', {
      location: 'USA'
    });

    const user2 = await prisma.user.findUnique({
      where: { employeeId: 'EMP_001' },
      select: { region: true }
    });

    console.log(`✓ Employee location: USA → User region: ${user2?.region}`);
    console.log(`  ${user2?.region === 'US' ? '✓ PASS' : '✗ FAIL'}\n`);

    // Test 3: Update to US (short form)
    console.log('=== Test 3: Update location to US ===');
    await employeeService.updateEmployee('EMP_001', {
      location: 'US'
    });

    const user3 = await prisma.user.findUnique({
      where: { employeeId: 'EMP_001' },
      select: { region: true }
    });

    console.log(`✓ Employee location: US → User region: ${user3?.region}`);
    console.log(`  ${user3?.region === 'US' ? '✓ PASS' : '✗ FAIL'}\n`);

    // Test 4: Update to IND
    console.log('=== Test 4: Update location to IND ===');
    await employeeService.updateEmployee('EMP_001', {
      location: 'IND'
    });

    const user4 = await prisma.user.findUnique({
      where: { employeeId: 'EMP_001' },
      select: { region: true }
    });

    console.log(`✓ Employee location: IND → User region: ${user4?.region}`);
    console.log(`  ${user4?.region === 'IND' ? '✓ PASS' : '✗ FAIL'}\n`);

    console.log('=== All Tests Completed ===');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testBidirectionalSync()
  .then(() => {
    console.log('\n=== Test script finished ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n=== Test script failed ===');
    console.error(error);
    process.exit(1);
  });
