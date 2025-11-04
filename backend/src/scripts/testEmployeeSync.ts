import { PrismaClient } from '@prisma/client';
import employeeService from '../services/employeeService';

const prisma = new PrismaClient();

async function testEmployeeSync() {
  console.log('Starting Employee-LMS User Sync Test...\n');

  const testEmployeeId = 'TEST_SYNC_001';

  try {
    // Clean up any existing test data
    console.log('1. Cleaning up existing test data...');
    await prisma.leaveBalance.deleteMany({
      where: { employeeId: testEmployeeId }
    });
    await prisma.user.deleteMany({
      where: { employeeId: testEmployeeId }
    });
    await prisma.employee.deleteMany({
      where: { employeeId: testEmployeeId }
    });
    console.log('   ✓ Cleanup complete\n');

    // Create test employee
    console.log('2. Creating test employee...');
    const employee = await employeeService.createEmployee({
      employeeId: testEmployeeId,
      firstName: 'Test',
      lastName: 'User',
      email: 'test.sync@example.com',
      phoneNumber: '1234567890',
      location: 'India',
      designation: 'Software Engineer',
      department: 'Engineering',
      employmentType: 'FTE',
      reportingManager: 'Manager Name',
      reportingManagerId: 'MGR001',
      lmsAccess: 'EMP',
      isActive: true
    });
    console.log('   ✓ Employee created:', employee.employeeId);
    console.log('     Location:', employee.location, '\n');

    // Create LMS user for the employee
    console.log('3. Creating LMS user...');
    const createResult = await employeeService.createLMSUsers([testEmployeeId]);
    console.log('   ✓ LMS user created:', createResult.created, 'user(s)');

    // Fetch the created user to verify initial state
    const userBefore = await prisma.user.findUnique({
      where: { employeeId: testEmployeeId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        region: true,
        role: true,
        designation: true,
        phoneNumber: true,
        employmentType: true,
        isActive: true
      }
    });
    console.log('   Initial User State:', userBefore, '\n');

    // Update employee details
    console.log('4. Updating employee details...');
    console.log('   Changes to apply:');
    console.log('     - First Name: Test → John');
    console.log('     - Last Name: User → Doe');
    console.log('     - Location: India → USA');
    console.log('     - LMS Access: EMP → MGR');
    console.log('     - Designation: Software Engineer → Senior Engineer');
    console.log('     - Phone: 1234567890 → 9876543210\n');

    const updatedEmployee = await employeeService.updateEmployee(employee.employeeId, {
      firstName: 'John',
      lastName: 'Doe',
      location: 'USA',
      lmsAccess: 'MGR',
      designation: 'Senior Engineer',
      phoneNumber: '9876543210'
    });
    console.log('   ✓ Employee updated\n');

    // Fetch the updated user to verify sync
    console.log('5. Verifying LMS user was synced...');
    const userAfter = await prisma.user.findUnique({
      where: { employeeId: testEmployeeId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        region: true,
        role: true,
        designation: true,
        phoneNumber: true,
        employmentType: true,
        isActive: true
      }
    });
    console.log('   Updated User State:', userAfter, '\n');

    // Verify changes
    console.log('6. Validation Results:');
    let allPassed = true;

    if (userAfter?.firstName === 'John') {
      console.log('   ✓ First Name synced correctly');
    } else {
      console.log('   ✗ First Name NOT synced:', userAfter?.firstName);
      allPassed = false;
    }

    if (userAfter?.lastName === 'Doe') {
      console.log('   ✓ Last Name synced correctly');
    } else {
      console.log('   ✗ Last Name NOT synced:', userAfter?.lastName);
      allPassed = false;
    }

    if (userAfter?.region === 'US') {
      console.log('   ✓ Region synced correctly (location → region mapping)');
    } else {
      console.log('   ✗ Region NOT synced:', userAfter?.region);
      allPassed = false;
    }

    if (userAfter?.role === 'MANAGER') {
      console.log('   ✓ Role synced correctly (LMS Access → role mapping)');
    } else {
      console.log('   ✗ Role NOT synced:', userAfter?.role);
      allPassed = false;
    }

    if (userAfter?.designation === 'Senior Engineer') {
      console.log('   ✓ Designation synced correctly');
    } else {
      console.log('   ✗ Designation NOT synced:', userAfter?.designation);
      allPassed = false;
    }

    if (userAfter?.phoneNumber === '9876543210') {
      console.log('   ✓ Phone Number synced correctly');
    } else {
      console.log('   ✗ Phone Number NOT synced:', userAfter?.phoneNumber);
      allPassed = false;
    }

    console.log('\n7. Test Summary:');
    if (allPassed) {
      console.log('   ✓✓✓ ALL TESTS PASSED ✓✓✓');
      console.log('   Employee-to-LMS-User sync is working correctly!\n');
    } else {
      console.log('   ✗✗✗ SOME TESTS FAILED ✗✗✗');
      console.log('   Please review the sync logic in employeeService.ts\n');
    }

    // Clean up test data
    console.log('8. Cleaning up test data...');
    await prisma.leaveBalance.deleteMany({
      where: { employeeId: testEmployeeId }
    });
    await prisma.user.deleteMany({
      where: { employeeId: testEmployeeId }
    });
    await prisma.employee.deleteMany({
      where: { employeeId: testEmployeeId }
    });
    console.log('   ✓ Test data removed\n');

    console.log('Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);

    // Clean up on error
    try {
      await prisma.leaveBalance.deleteMany({
        where: { employeeId: testEmployeeId }
      });
      await prisma.user.deleteMany({
        where: { employeeId: testEmployeeId }
      });
      await prisma.employee.deleteMany({
        where: { employeeId: testEmployeeId }
      });
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }

    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testEmployeeSync()
  .then(() => {
    console.log('\n=== Test script finished ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n=== Test script failed ===');
    console.error(error);
    process.exit(1);
  });
