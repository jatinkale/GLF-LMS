const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';

// Test data
const testHoliday = {
  year: 2025,
  date: '2025-12-25',
  description: 'Christmas',
  location: 'US'
};

async function testHolidayAPI() {
  try {
    // 1. Login as Admin
    console.log('1. Logging in as Admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@golivefaster.com',
      password: 'Admin@123'
    });

    const token = loginResponse.data.token;
    console.log('✓ Login successful');

    // Set default auth header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 2. Get all holidays
    console.log('\n2. Fetching all holidays...');
    const holidaysResponse = await axios.get(`${API_URL}/holidays`);
    console.log(`✓ Found ${holidaysResponse.data.data.length} holidays`);
    console.log('Holidays:', JSON.stringify(holidaysResponse.data.data, null, 2));

    // 3. Create a new holiday
    console.log('\n3. Creating a new holiday...');
    const createResponse = await axios.post(`${API_URL}/holidays`, testHoliday);
    console.log('✓ Holiday created successfully');
    console.log('Created holiday:', JSON.stringify(createResponse.data.data, null, 2));

    const createdHolidayId = createResponse.data.data.id;

    // 4. Get holidays with filters
    console.log('\n4. Testing filters...');
    const filteredResponse = await axios.get(`${API_URL}/holidays?year=2025&location=US`);
    console.log(`✓ Found ${filteredResponse.data.data.length} holidays for 2025, US`);

    // 5. Delete the test holiday
    console.log('\n5. Deleting test holiday...');
    await axios.delete(`${API_URL}/holidays/${createdHolidayId}`);
    console.log('✓ Holiday deleted successfully');

    console.log('\n✅ All Holiday API tests passed!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testHolidayAPI();
