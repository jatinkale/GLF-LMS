/**
 * Test Script for Special Actions API Endpoints
 * This script tests all the new endpoints created for the Special Actions functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@golivefaster.com',
  password: 'Admin@123'
};

let authToken = '';

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
};

// Test 1: Login as Admin
const testLogin = async () => {
  console.log('\n=== Test 1: Admin Login ===');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    authToken = response.data.data.token;
    console.log('✅ Login successful');
    console.log('   Token:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
};

// Test 2: Get All Leave Types
const testGetAllLeaveTypes = async () => {
  console.log('\n=== Test 2: Get All Leave Types ===');
  const result = await makeRequest('GET', '/admin/leave-types-all');

  if (result.success) {
    console.log('✅ Successfully fetched leave types');
    console.log(`   Found ${result.data.data.length} leave types:`);
    result.data.data.forEach(lt => {
      console.log(`   - ${lt.leaveTypeCode}: ${lt.name} (${lt.category})`);
    });
    return result.data.data;
  } else {
    console.log('❌ Failed to fetch leave types:', result.error);
    return null;
  }
};

// Test 3: Search Employees - All Active
const testSearchEmployeesAll = async () => {
  console.log('\n=== Test 3: Search Employees - All Active ===');
  const result = await makeRequest('POST', '/admin/search-employees-bulk', {});

  if (result.success) {
    console.log('✅ Successfully searched employees');
    console.log(`   Found ${result.data.data.length} active employees`);
    if (result.data.data.length > 0) {
      console.log('   Sample employees:');
      result.data.data.slice(0, 3).forEach(emp => {
        console.log(`   - ${emp.employeeId}: ${emp.firstName} ${emp.lastName} (${emp.gender}, ${emp.region})`);
      });
    }
    return result.data.data;
  } else {
    console.log('❌ Failed to search employees:', result.error);
    return null;
  }
};

// Test 4: Search Employees with Filters
const testSearchEmployeesFiltered = async () => {
  console.log('\n=== Test 4: Search Employees - Filtered (India, Male) ===');
  const result = await makeRequest('POST', '/admin/search-employees-bulk', {
    location: 'IND',
    gender: 'M'
  });

  if (result.success) {
    console.log('✅ Successfully filtered employees');
    console.log(`   Found ${result.data.data.length} male employees in India`);
    if (result.data.data.length > 0) {
      console.log('   Filtered employees:');
      result.data.data.slice(0, 3).forEach(emp => {
        console.log(`   - ${emp.employeeId}: ${emp.firstName} ${emp.lastName}`);
      });
    }
    return result.data.data;
  } else {
    console.log('❌ Failed to filter employees:', result.error);
    return null;
  }
};

// Test 5: Search Employees by IDs
const testSearchEmployeesByIds = async (employeeIds) => {
  console.log('\n=== Test 5: Search Employees - By IDs ===');
  const result = await makeRequest('POST', '/admin/search-employees-bulk', {
    employeeIds: employeeIds.join(',')
  });

  if (result.success) {
    console.log('✅ Successfully searched by employee IDs');
    console.log(`   Found ${result.data.data.length} employees`);
    return result.data.data;
  } else {
    console.log('❌ Failed to search by IDs:', result.error);
    return null;
  }
};

// Test 6: Process Special Leave - Single User ADD
const testProcessSpecialAdd = async (employeeId, leaveTypeCode = 'CL') => {
  console.log('\n=== Test 6: Process Special Leave - Single User ADD ===');
  const result = await makeRequest('POST', '/admin/leave-policy/process-special', {
    employeeId: employeeId,
    leaveTypeCode: leaveTypeCode,
    numberOfLeaves: 5,
    action: 'ADD',
    comments: 'Test ADD operation from special actions test script'
  });

  if (result.success) {
    console.log('✅ Successfully added leaves');
    console.log(`   Added 5 days of ${leaveTypeCode} to employee ${employeeId}`);
    return true;
  } else {
    console.log('❌ Failed to add leaves:', result.error);
    return false;
  }
};

// Test 7: Process Special Leave - Single User REMOVE
const testProcessSpecialRemove = async (employeeId, leaveTypeCode = 'CL') => {
  console.log('\n=== Test 7: Process Special Leave - Single User REMOVE ===');
  const result = await makeRequest('POST', '/admin/leave-policy/process-special', {
    employeeId: employeeId,
    leaveTypeCode: leaveTypeCode,
    numberOfLeaves: 2,
    action: 'REMOVE',
    comments: 'Test REMOVE operation from special actions test script'
  });

  if (result.success) {
    console.log('✅ Successfully removed leaves');
    console.log(`   Removed 2 days of ${leaveTypeCode} from employee ${employeeId}`);
    return true;
  } else {
    console.log('❌ Failed to remove leaves:', result.error);
    console.log(`   (This is expected if employee doesn't have sufficient balance)`);
    return false;
  }
};

// Test 8: Process Special Leave - Bulk ADD
const testProcessBulkAdd = async (employeeIds, leaveTypeCode = 'CL') => {
  console.log('\n=== Test 8: Process Special Leave - Bulk ADD ===');
  const result = await makeRequest('POST', '/admin/leave-policy/process-special-bulk', {
    employeeIds: employeeIds,
    leaveTypeCode: leaveTypeCode,
    numberOfLeaves: 3,
    action: 'ADD',
    comments: 'Test bulk ADD operation from special actions test script'
  });

  if (result.success) {
    console.log('✅ Successfully processed bulk ADD');
    console.log(`   Processed: ${result.data.data.processed} employees`);
    console.log(`   Errors: ${result.data.data.errors}`);
    console.log(`   Warnings: ${result.data.data.warnings}`);

    if (result.data.data.details) {
      if (result.data.data.details.processedEmployees.length > 0) {
        console.log('   Successfully processed:');
        result.data.data.details.processedEmployees.forEach(emp => {
          console.log(`   - ${emp}`);
        });
      }
      if (result.data.data.details.errorMessages.length > 0) {
        console.log('   Errors:');
        result.data.data.details.errorMessages.forEach(err => {
          console.log(`   - ${err}`);
        });
      }
    }
    return true;
  } else {
    console.log('❌ Failed to process bulk ADD:', result.error);
    return false;
  }
};

// Test 9: Process Special Leave - Bulk REMOVE
const testProcessBulkRemove = async (employeeIds, leaveTypeCode = 'CL') => {
  console.log('\n=== Test 9: Process Special Leave - Bulk REMOVE ===');
  const result = await makeRequest('POST', '/admin/leave-policy/process-special-bulk', {
    employeeIds: employeeIds,
    leaveTypeCode: leaveTypeCode,
    numberOfLeaves: 1,
    action: 'REMOVE',
    comments: 'Test bulk REMOVE operation from special actions test script'
  });

  if (result.success) {
    console.log('✅ Successfully processed bulk REMOVE');
    console.log(`   Processed: ${result.data.data.processed} employees`);
    console.log(`   Errors: ${result.data.data.errors}`);
    console.log(`   Warnings: ${result.data.data.warnings}`);

    if (result.data.data.details) {
      if (result.data.data.details.processedEmployees.length > 0) {
        console.log('   Successfully processed:');
        result.data.data.details.processedEmployees.forEach(emp => {
          console.log(`   - ${emp}`);
        });
      }
      if (result.data.data.details.errorMessages.length > 0) {
        console.log('   Errors:');
        result.data.data.details.errorMessages.forEach(err => {
          console.log(`   - ${err}`);
        });
      }
    }
    return true;
  } else {
    console.log('❌ Failed to process bulk REMOVE:', result.error);
    return false;
  }
};

// Test 10: Validation Tests
const testValidations = async () => {
  console.log('\n=== Test 10: Validation Tests ===');

  // Test missing action
  console.log('\n  10a. Test missing action parameter');
  let result = await makeRequest('POST', '/admin/leave-policy/process-special', {
    employeeId: 'TEST001',
    leaveTypeCode: 'CL',
    numberOfLeaves: 5,
    comments: 'Test'
  });
  console.log(result.success ? '❌ Should have failed' : '✅ Correctly rejected missing action');

  // Test invalid action
  console.log('\n  10b. Test invalid action value');
  result = await makeRequest('POST', '/admin/leave-policy/process-special', {
    employeeId: 'TEST001',
    leaveTypeCode: 'CL',
    numberOfLeaves: 5,
    action: 'INVALID',
    comments: 'Test'
  });
  console.log(result.success ? '❌ Should have failed' : '✅ Correctly rejected invalid action');

  // Test empty employee list for bulk
  console.log('\n  10c. Test empty employee list for bulk');
  result = await makeRequest('POST', '/admin/leave-policy/process-special-bulk', {
    employeeIds: [],
    leaveTypeCode: 'CL',
    numberOfLeaves: 5,
    action: 'ADD',
    comments: 'Test'
  });
  console.log(result.success ? '❌ Should have failed' : '✅ Correctly rejected empty employee list');
};

// Main test runner
const runAllTests = async () => {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       Special Actions API Endpoints Test Suite           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Test 1: Login
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without successful login');
    return;
  }

  // Test 2: Get all leave types
  const leaveTypes = await testGetAllLeaveTypes();

  // Test 3: Search all employees
  const allEmployees = await testSearchEmployeesAll();

  // Test 4: Search filtered employees
  await testSearchEmployeesFiltered();

  // Get first employee for single user tests
  let testEmployee = null;
  let testEmployeeIds = [];

  if (allEmployees && allEmployees.length > 0) {
    testEmployee = allEmployees[0];
    testEmployeeIds = allEmployees.slice(0, 3).map(emp => emp.employeeId);

    // Test 5: Search by IDs
    await testSearchEmployeesByIds(testEmployeeIds);

    // Test 6: Single user ADD
    await testProcessSpecialAdd(testEmployee.employeeId);

    // Test 7: Single user REMOVE
    await testProcessSpecialRemove(testEmployee.employeeId);

    // Test 8: Bulk ADD
    await testProcessBulkAdd(testEmployeeIds);

    // Test 9: Bulk REMOVE
    await testProcessBulkRemove(testEmployeeIds);
  } else {
    console.log('\n⚠️  No employees found to test special leave operations');
  }

  // Test 10: Validation tests
  await testValidations();

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║              All Tests Completed                          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
};

// Run the tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error during testing:', error.message);
  process.exit(1);
});
