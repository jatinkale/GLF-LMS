/**
 * Test Script for Location-Based Leave Type Validation
 * Tests that CL/PL (IND only) and PTO/BL (US only) enforce region restrictions
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

// Get test employees by region
const getTestEmployees = async () => {
  console.log('\n=== Fetching Test Employees ===');
  const result = await makeRequest('POST', '/admin/search-employees-bulk', {});

  if (result.success) {
    const employees = result.data.data;
    const indEmployee = employees.find(emp => emp.region === 'IND');
    const usEmployee = employees.find(emp => emp.region === 'US');

    console.log(`✅ Found ${employees.length} employees`);
    if (indEmployee) {
      console.log(`   India: ${indEmployee.firstName} ${indEmployee.lastName} (${indEmployee.employeeId})`);
    }
    if (usEmployee) {
      console.log(`   US: ${usEmployee.firstName} ${usEmployee.lastName} (${usEmployee.employeeId})`);
    }

    return { indEmployee, usEmployee };
  } else {
    console.log('❌ Failed to fetch employees:', result.error);
    return null;
  }
};

// Test 1: Try to add CL to US employee (should fail)
const testCLForUS = async (usEmployee) => {
  console.log('\n=== Test 1: Add Casual Leave (CL) to US Employee (SHOULD FAIL) ===');
  console.log(`   Employee: ${usEmployee.firstName} ${usEmployee.lastName} (${usEmployee.employeeId}) - US`);

  const result = await makeRequest('POST', '/admin/leave-policy/process-special', {
    employeeId: usEmployee.employeeId,
    leaveTypeCode: 'CL',
    numberOfLeaves: 12,
    action: 'ADD',
    comments: 'Test location validation for CL on US employee'
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

// Test 2: Try to add PTO to IND employee (should fail)
const testPTOForIND = async (indEmployee) => {
  console.log('\n=== Test 2: Add PTO to India Employee (SHOULD FAIL) ===');
  console.log(`   Employee: ${indEmployee.firstName} ${indEmployee.lastName} (${indEmployee.employeeId}) - IND`);

  const result = await makeRequest('POST', '/admin/leave-policy/process-special', {
    employeeId: indEmployee.employeeId,
    leaveTypeCode: 'PTO',
    numberOfLeaves: 20,
    action: 'ADD',
    comments: 'Test location validation for PTO on IND employee'
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

// Test 3: Try to add CL to IND employee (should succeed)
const testCLForIND = async (indEmployee) => {
  console.log('\n=== Test 3: Add Casual Leave (CL) to India Employee (SHOULD SUCCEED) ===');
  console.log(`   Employee: ${indEmployee.firstName} ${indEmployee.lastName} (${indEmployee.employeeId}) - IND`);

  const result = await makeRequest('POST', '/admin/leave-policy/process-special', {
    employeeId: indEmployee.employeeId,
    leaveTypeCode: 'CL',
    numberOfLeaves: 12,
    action: 'ADD',
    comments: 'Test valid CL assignment to India employee'
  });

  if (result.success) {
    console.log('✅ VALIDATION PASSED: Operation correctly succeeded');
    console.log(`   Added 12 days of CL to ${indEmployee.firstName} ${indEmployee.lastName}`);
    return true;
  } else {
    console.log('❌ VALIDATION FAILED: Operation should have succeeded but was rejected!');
    console.log(`   Error: ${result.error}`);
    return false;
  }
};

// Test 4: Try to add PTO to US employee (should succeed)
const testPTOForUS = async (usEmployee) => {
  console.log('\n=== Test 4: Add PTO to US Employee (SHOULD SUCCEED) ===');
  console.log(`   Employee: ${usEmployee.firstName} ${usEmployee.lastName} (${usEmployee.employeeId}) - US`);

  const result = await makeRequest('POST', '/admin/leave-policy/process-special', {
    employeeId: usEmployee.employeeId,
    leaveTypeCode: 'PTO',
    numberOfLeaves: 20,
    action: 'ADD',
    comments: 'Test valid PTO assignment to US employee'
  });

  if (result.success) {
    console.log('✅ VALIDATION PASSED: Operation correctly succeeded');
    console.log(`   Added 20 days of PTO to ${usEmployee.firstName} ${usEmployee.lastName}`);
    return true;
  } else {
    console.log('❌ VALIDATION FAILED: Operation should have succeeded but was rejected!');
    console.log(`   Error: ${result.error}`);
    return false;
  }
};

// Test 5: Try to add COMP (ALL regions) to both IND and US (should succeed for both)
const testCOMPForAll = async (indEmployee, usEmployee) => {
  console.log('\n=== Test 5: Add COMP (ALL regions) to Both IND and US Employees (SHOULD SUCCEED) ===');

  // Test IND employee
  console.log(`\n   Testing India Employee: ${indEmployee.firstName} ${indEmployee.lastName}`);
  const indResult = await makeRequest('POST', '/admin/leave-policy/process-special', {
    employeeId: indEmployee.employeeId,
    leaveTypeCode: 'COMP',
    numberOfLeaves: 5,
    action: 'ADD',
    comments: 'Test COMP for IND employee'
  });

  // Test US employee
  console.log(`   Testing US Employee: ${usEmployee.firstName} ${usEmployee.lastName}`);
  const usResult = await makeRequest('POST', '/admin/leave-policy/process-special', {
    employeeId: usEmployee.employeeId,
    leaveTypeCode: 'COMP',
    numberOfLeaves: 5,
    action: 'ADD',
    comments: 'Test COMP for US employee'
  });

  if (indResult.success && usResult.success) {
    console.log('✅ VALIDATION PASSED: COMP assigned to both regions successfully');
    return true;
  } else {
    console.log('❌ VALIDATION FAILED: COMP should be available to all regions');
    if (!indResult.success) console.log(`   IND Error: ${indResult.error}`);
    if (!usResult.success) console.log(`   US Error: ${usResult.error}`);
    return false;
  }
};

// Test 6: Bulk operation with mixed regions for CL (should have errors)
const testBulkCLMixed = async (indEmployee, usEmployee) => {
  console.log('\n=== Test 6: Bulk Add CL to Mixed Regions (SHOULD HAVE ERRORS) ===');
  console.log(`   Employees: ${indEmployee.employeeId} (IND), ${usEmployee.employeeId} (US)`);

  const result = await makeRequest('POST', '/admin/leave-policy/process-special-bulk', {
    employeeIds: [indEmployee.employeeId, usEmployee.employeeId],
    leaveTypeCode: 'CL',
    numberOfLeaves: 12,
    action: 'ADD',
    comments: 'Test bulk location validation for CL'
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

    // Check that US was rejected and IND was processed
    const hasUSError = data.details.errorMessages.some(err => err.includes(usEmployee.employeeId));
    const hasINDSuccess = data.details.processedEmployees.some(emp => emp.includes(indEmployee.employeeId));

    if (hasUSError && hasINDSuccess) {
      console.log('✅ Correct behavior: US rejected, IND processed');
      return true;
    } else {
      console.log('❌ Incorrect behavior: Expected US to be rejected and IND to be processed');
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
  console.log('║   Location-Based Leave Type Validation Test Suite        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Login
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without successful login');
    return;
  }

  // Get test employees
  const employees = await getTestEmployees();
  if (!employees || !employees.indEmployee || !employees.usEmployee) {
    console.log('\n❌ Cannot proceed without both IND and US test employees');
    return;
  }

  const { indEmployee, usEmployee } = employees;

  // Run all tests
  const results = [];

  results.push(await testCLForUS(usEmployee));
  results.push(await testPTOForIND(indEmployee));
  results.push(await testCLForIND(indEmployee));
  results.push(await testPTOForUS(usEmployee));
  results.push(await testCOMPForAll(indEmployee, usEmployee));
  results.push(await testBulkCLMixed(indEmployee, usEmployee));

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
    console.log('\n🎉 All location validation tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
};

// Run the tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error during testing:', error.message);
  process.exit(1);
});
