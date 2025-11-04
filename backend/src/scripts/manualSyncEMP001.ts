import employeeService from '../services/employeeService';

async function manualSyncEMP001() {
  console.log('Manually triggering sync for EMP_001...\n');

  try {
    // Update EMP_001 with location set to "US"
    console.log('Calling employeeService.updateEmployee with location: "US"');

    const result = await employeeService.updateEmployee('EMP_001', {
      location: 'US'
    });

    console.log('\n✓ Update completed');
    console.log('Result:', result);

  } catch (error) {
    console.error('\n❌ Update failed:', error);
    throw error;
  }
}

// Run the manual sync
manualSyncEMP001()
  .then(() => {
    console.log('\n=== Manual sync finished ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n=== Manual sync failed ===');
    console.error(error);
    process.exit(1);
  });
