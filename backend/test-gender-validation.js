/**
 * Test Script for Gender-Based Leave Type Validation
 * Tests that ML and PTL leave types enforce gender restrictions
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

// Test Login
const testLogin = async () => {
  console.log('\n=== Login as Admin ===');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    authToken = response.data.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
};

// Get test employees
const getTestEmployees = async () => {
  console.log('\n=== Fetching Test Employees ===');
  const result = await makeRequest('POST', '/admin/search-employees-bulk', {});

  if (result.success) {
    const employees = result.data.data;
    const maleEmployee = employees.find(emp => emp.gender === 'M');
    const femaleEmployee = employees.find(emp => emp.gender === 'F');

    console.log(`✅ Found ${employees.length} employees`);
    if (maleEmployee) {
      console.log(`   Male: ${maleEmployee.firstName} ${maleEmployee.lastName} (${maleEmployee.employeeId})`);
    }
    if (femaleEmployee) {
      console.log(`   Female: ${femaleEmployee.firstName} ${femaleEmployee.lastName} (${femaleEmployee.employeeId})`);
    }

    return { maleEmployee, femaleEmployee };
  } else {
    console.log('❌ Failed to fetch employees:', result.error);
    return null;
  }
};

// Test 1: Try to add ML to male employee (should fail)
const testMLForMale = async (maleEmployee) => {
  console.log('\n=== Test 1: Add Maternity Leave to Male Employee (SHOULD FAIL) ===');
  console.log(`   Employee: ${maleEmployee.firstName} ${maleEmployee.lastName} (${maleEmployee.employeeId})`);

  const result = await makeRequest('POST', '/admin/leave-policy/process-special', {
    employeeId: maleEmployee.employeeId,
    leaveTypeCode: 'ML',
    numberOfLeaves: 5,
    action: 'ADD',
    comments: 'Test gender validation for ML on male employee'
  });

  if (result.success) {
    console.log('❌ VALIDATION FAILED: Operation should have been rejected but succeeded!');
    return false;
  } else {
    console.log('✅ VALIDATION PASSED: Operation correctly rejected');
    console.log(`   Error: ${result.error}`);
    return true;
  }
};

// Test 2: Try to add PTL to female employee (should fail)
const testPTLForFemale = async (femaleEmployee) => {
  console.log('\n=== Test 2: Add Paternity Leave to Female Employee (SHOULD FAIL) ===');
  console.log(`   Employee: ${femaleEmployee.firstName} ${femaleEmployee.lastName} (${femaleEmployee.employeeId})`);

  const result = await makeRequest('POST', '/admin/leave-policy/process-special', {
    employeeId: femaleEmployee.employeeId,
    leaveTypeCode: 'PTL',
    numberOfLeaves: 5,
    action: 'ADD',
    comments: 'Test gender validation for PTL on female employee'
  });

  if (result.success) {
    console.log('❌ VALIDATION FAILED: Operation should have been rejected but succeeded!');
    return false;
  } else {
    console.log('✅ VALIDATION PASSED: Operation correctly rejected');
    console.log(`   Error: ${result.error}`);
    return true;
  }
};

// Test 3: Try to add ML to female employee (should succeed)
const testMLForFemale = async (femaleEmployee) => {
  console.log('\n=== Test 3: Add Maternity Leave to Female Employee (SHOULD SUCCEED) ===');
  console.log(`   Employee: ${femaleEmployee.firstName} ${femaleEmployee.lastName} (${femaleEmployee.employeeId})`);

  const result = await makeRequest('POST', '/admin/leave-policy/process-special', {
    employeeId: femaleEmployee.employeeId,
    leaveTypeCode: 'ML',
    numberOfLeaves: 90,
    action: 'ADD',
    comments: 'Test valid ML assignment to female employee'
  });

  if (result.success) {
    console.log('✅ VALIDATION PASSED: Operation correctly succeeded');
    console.log(`   Added 90 days of ML to ${femaleEmployee.firstName} ${femaleEmployee.lastName}`);
    return true;
  } else {
    console.log('❌ VALIDATION FAILED: Operation should have succeeded but was rejected!');
    console.log(`   Error: ${result.error}`);
    return false;
  }
};

// Test 4: Try to add PTL to male employee (should succeed)
const testPTLForMale = async (maleEmployee) => {
  console.log('\n=== Test 4: Add Paternity Leave to Male Employee (SHOULD SUCCEED) ===');
  console.log(`   Employee: ${maleEmployee.firstName} ${maleEmployee.lastName} (${maleEmployee.employeeId})`);

  const result = await makeRequest('POST', '/admin/leave-policy/process-special', {
    employeeId: maleEmployee.employeeId,
    leaveTypeCode: 'PTL',
    numberOfLeaves: 15,
    action: 'ADD',
    comments: 'Test valid PTL assignment to male employee'
  });

  if (result.success) {
    console.log('✅ VALIDATION PASSED: Operation correctly succeeded');
    console.log(`   Added 15 days of PTL to ${maleEmployee.firstName} ${maleEmployee.lastName}`);
    return true;
  } else {
    console.log('❌ VALIDATION FAILED: Operation should have succeeded but was rejected!');
    console.log(`   Error: ${result.error}`);
    return false;
  }
};

// Test 5: Bulk operation with mixed genders for ML (should have errors)
const testBulkMLMixed = async (maleEmployee, femaleEmployee) => {
  console.log('\n=== Test 5: Bulk Add ML to Mixed Gender Group (SHOULD HAVE ERRORS) ===');
  console.log(`   Employees: ${maleEmployee.employeeId} (M), ${femaleEmployee.employeeId} (F)`);

  const result = await makeRequest('POST', '/admin/leave-policy/process-special-bulk', {
    employeeIds: [maleEmployee.employeeId, femaleEmployee.employeeId],
    leaveTypeCode: 'ML',
    numberOfLeaves: 90,
    action: 'ADD',
    comments: 'Test bulk gender validation for ML'
  });

  if (result.success) {
    const data = result.data.data;
    console.log('✅ VALIDATION PASSED: Bulk operation completed with expected errors');
    console.log(`   Processed: ${data.processed} employee(s)`);
    console.log(`   Errors: ${data.errors} employee(s)`);

    if (data.details.processedEmployees.length > 0) {
      console.log('   Successfully processed:');
      data.details.processedEmployees.forEach(emp => {
        console.log(`   - ${emp}`);
      });
    }

    if (data.details.errorMessages.length > 0) {
      console.log('   Errors (as expected):');
      data.details.errorMessages.forEach(err => {
        console.log(`   - ${err}`);
      });
    }

    // Check that male was rejected and female was processed
    const hasMaleError = data.details.errorMessages.some(err => err.includes(maleEmployee.employeeId));
    const hasFemaleSuccess = data.details.processedEmployees.some(emp => emp.includes(femaleEmployee.employeeId));

    if (hasMaleError && hasFemaleSuccess) {
      console.log('✅ Correct behavior: Male rejected, Female processed');
      return true;
    } else {
      console.log('❌ Incorrect behavior: Expected male to be rejected and female to be processed');
      return false;
    }
  } else {
    console.log('❌ VALIDATION FAILED: Bulk operation failed completely');
    console.log(`   Error: ${result.error}`);
    return false;
  }
};

// Test 6: Bulk operation with mixed genders for PTL (should have errors)
const testBulkPTLMixed = async (maleEmployee, femaleEmployee) => {
  console.log('\n=== Test 6: Bulk Add PTL to Mixed Gender Group (SHOULD HAVE ERRORS) ===');
  console.log(`   Employees: ${maleEmployee.employeeId} (M), ${femaleEmployee.employeeId} (F)`);

  const result = await makeRequest('POST', '/admin/leave-policy/process-special-bulk', {
    employeeIds: [maleEmployee.employeeId, femaleEmployee.employeeId],
    leaveTypeCode: 'PTL',
    numberOfLeaves: 15,
    action: 'ADD',
    comments: 'Test bulk gender validation for PTL'
  });

  if (result.success) {
    const data = result.data.data;
    console.log('✅ VALIDATION PASSED: Bulk operation completed with expected errors');
    console.log(`   Processed: ${data.processed} employee(s)`);
    console.log(`   Errors: ${data.errors} employee(s)`);

    if (data.details.processedEmployees.length > 0) {
      console.log('   Successfully processed:');
      data.details.processedEmployees.forEach(emp => {
        console.log(`   - ${emp}`);
      });
    }

    if (data.details.errorMessages.length > 0) {
      console.log('   Errors (as expected):');
      data.details.errorMessages.forEach(err => {
        console.log(`   - ${err}`);
      });
    }

    // Check that female was rejected and male was processed
    const hasFemaleError = data.details.errorMessages.some(err => err.includes(femaleEmployee.employeeId));
    const hasMaleSuccess = data.details.processedEmployees.some(emp => emp.includes(maleEmployee.employeeId));

    if (hasFemaleError && hasMaleSuccess) {
      console.log('✅ Correct behavior: Female rejected, Male processed');
      return true;
    } else {
      console.log('❌ Incorrect behavior: Expected female to be rejected and male to be processed');
      return false;
    }
  } else {
    console.log('❌ VALIDATION FAILED: Bulk operation failed completely');
    console.log(`   Error: ${result.error}`);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     Gender-Based Leave Type Validation Test Suite        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Login
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without successful login');
    return;
  }

  // Get test employees
  const employees = await getTestEmployees();
  if (!employees || !employees.maleEmployee || !employees.femaleEmployee) {
    console.log('\n❌ Cannot proceed without both male and female test employees');
    return;
  }

  const { maleEmployee, femaleEmployee } = employees;

  // Run all tests
  const results = [];

  results.push(await testMLForMale(maleEmployee));
  results.push(await testPTLForFemale(femaleEmployee));
  results.push(await testMLForFemale(femaleEmployee));
  results.push(await testPTLForMale(maleEmployee));
  results.push(await testBulkMLMixed(maleEmployee, femaleEmployee));
  results.push(await testBulkPTLMixed(maleEmployee, femaleEmployee));

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    Test Summary                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r === true).length;
  const failed = results.filter(r => r === false).length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);

  if (failed === 0) {
    console.log('\n🎉 All gender validation tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
};

// Run the tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error during testing:', error.message);
  process.exit(1);
});
