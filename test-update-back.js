// Test updating back to FTE
const http = require('http');

const baseUrl = 'http://localhost:3001/api/v1';

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
  console.log('\n=== Test Updating Employment Type Back to FTE ===\n');

  try {
    // Login
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: 'admin@golivefaster.com',
      password: 'Admin@123'
    });

    const authToken = loginResponse.data.token;
    console.log('✓ Login successful\n');

    // Get current state
    const employeesResponse = await makeRequest('GET', '/employees', null, authToken);
    const emp005Before = employeesResponse.data.find(emp => emp.employeeId === 'EMP_005');
    console.log('Current Employment Type:', emp005Before.employmentType);

    // Update to FTE
    console.log('Updating back to FTE...');
    const updateResponse = await makeRequest('PUT', '/employees/EMP_005', {
      employmentType: 'FTE'
    }, authToken);

    console.log('✓ Update response:', updateResponse.success ? 'SUCCESS' : 'FAILED');
    console.log('  Employment Type in response:', updateResponse.data.employmentType);

    // Verify
    const verifyResponse = await makeRequest('GET', '/employees', null, authToken);
    const emp005After = verifyResponse.data.find(emp => emp.employeeId === 'EMP_005');
    console.log('\n✓ Verification:');
    console.log('  Before:', emp005Before.employmentType);
    console.log('  After:', emp005After.employmentType);

    if (emp005After.employmentType === 'FTE') {
      console.log('\n✓✓ SUCCESS - Employment type updated back to FTE');
    } else {
      console.log('\n✗✗ FAILED - Employment type did NOT update');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
