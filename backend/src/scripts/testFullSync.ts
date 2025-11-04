import employeeService from '../services/employeeService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFullSync() {
  console.log('Testing full sync for EMP_001 (location + lmsAccess)...\n');

  try {
    // Get initial state
    console.log('=== Initial State ===');
    const initialUser = await prisma.user.findUnique({
      where: { employeeId: 'EMP_001' },
      select: { region: true, role: true }
    });
    console.log('User region:', initialUser?.region);
    console.log('User role:', initialUser?.role, '\n');

    // Test: Update both location to India and lmsAccess to MGR
    console.log('=== Updating: location → India, lmsAccess → MGR ===');
    await employeeService.updateEmployee('EMP_001', {
      location: 'India',
      lmsAccess: 'MGR'
    });

    const updatedUser = await prisma.user.findUnique({
      where: { employeeId: 'EMP_001' },
      select: { region: true, role: true }
    });

    console.log('\nAfter Update:');
    console.log('User region:', updatedUser?.region, `(expected: IND) ${updatedUser?.region === 'IND' ? '✓' : '✗'}`);
    console.log('User role:', updatedUser?.role, `(expected: MANAGER) ${updatedUser?.role === 'MANAGER' ? '✓' : '✗'}`);

    // Test 2: Switch to US and EMP
    console.log('\n=== Updating: location → US, lmsAccess → EMP ===');
    await employeeService.updateEmployee('EMP_001', {
      location: 'US',
      lmsAccess: 'EMP'
    });

    const finalUser = await prisma.user.findUnique({
      where: { employeeId: 'EMP_001' },
      select: { region: true, role: true }
    });

    console.log('\nAfter Update:');
    console.log('User region:', finalUser?.region, `(expected: US) ${finalUser?.region === 'US' ? '✓' : '✗'}`);
    console.log('User role:', finalUser?.role, `(expected: EMPLOYEE) ${finalUser?.role === 'EMPLOYEE' ? '✓' : '✗'}`);

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testFullSync()
  .then(() => {
    console.log('\n=== Test finished ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n=== Test failed ===');
    console.error(error);
    process.exit(1);
  });
