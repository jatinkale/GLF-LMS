// Test Employee Update API
const http = require('http');

const baseUrl = 'http://localhost:3001/api/v1';
let authToken = '';

// Helper function to make HTTP requests
function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test() {
  console.log('\n=== Employee Update API Test ===\n');

  try {
    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: 'admin@golivefaster.com',
      password: 'Admin@123'
    });

    if (!loginResponse.success) {
      console.error('✗ Login failed:', loginResponse.message);
      return;
    }

    authToken = loginResponse.data.token;
    console.log('✓ Login successful\n');

    // Step 2: Get all employees
    console.log('Step 2: Getting all employees...');
    const employeesResponse = await makeRequest('GET', '/employees', null, authToken);

    if (!employeesResponse.success) {
      console.error('✗ Failed to get employees:', employeesResponse.message);
      return;
    }

    const emp005Before = employeesResponse.data.find(emp => emp.employeeId === 'EMP_005');
    if (!emp005Before) {
      console.error('✗ EMP_005 not found');
      return;
    }

    console.log('✓ Found EMP_005');
    console.log('  Current Employment Type:', emp005Before.employmentType || 'NULL');
    console.log('  Current Location:', emp005Before.location || 'NULL');
    console.log('  Current Designation:', emp005Before.designation || 'NULL\n');

    // Step 3: Update EMP_005
    console.log('Step 3: Updating EMP_005 employment type to FTDC...');
    const updateResponse = await makeRequest('PUT', '/employees/EMP_005', {
      employmentType: 'FTDC'
    }, authToken);

    console.log('Update Response:', JSON.stringify(updateResponse, null, 2));

    if (!updateResponse.success) {
      console.error('✗ Update failed:', updateResponse.message);
      return;
    }

    console.log('✓ Update request returned success\n');

    // Step 4: Verify the update
    console.log('Step 4: Verifying update by re-fetching employees...');
    const verifyResponse = await makeRequest('GET', '/employees', null, authToken);

    const emp005After = verifyResponse.data.find(emp => emp.employeeId === 'EMP_005');
    if (!emp005After) {
      console.error('✗ EMP_005 not found after update');
      return;
    }

    console.log('✓ Found EMP_005 after update');
    console.log('  New Employment Type:', emp005After.employmentType || 'NULL');
    console.log('  Before:', emp005Before.employmentType || 'NULL');
    console.log('  After:', emp005After.employmentType || 'NULL\n');

    if (emp005After.employmentType === 'FTDC') {
      console.log('✓✓ VERIFICATION SUCCESSFUL - Employment type updated to FTDC');
    } else {
      console.log('✗✗ VERIFICATION FAILED - Employment type did NOT change');
      console.log('    This confirms the bug - update says success but data doesn\'t persist!\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
