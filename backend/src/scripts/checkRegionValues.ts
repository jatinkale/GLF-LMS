import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRegionValues() {
  console.log('Checking current region values...\n');

  try {
    // Check users table
    const users = await prisma.$queryRaw`SELECT region, COUNT(*) as count FROM users GROUP BY region` as any[];
    console.log('Users table - region distribution:');
    users.forEach((row: any) => {
      console.log(`  ${row.region}: ${row.count} user(s)`);
    });

    // Check leave_process_history table
    const history = await prisma.$queryRaw`SELECT region, COUNT(*) as count FROM leave_process_history GROUP BY region` as any[];
    console.log('\nLeave Process History table - region distribution:');
    if (history.length === 0) {
      console.log('  No records found');
    } else {
      history.forEach((row: any) => {
        console.log(`  ${row.region}: ${row.count} record(s)`);
      });
    }

  } catch (error) {
    console.error('\nError:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkRegionValues()
  .then(() => {
    console.log('\n=== Check completed ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n=== Check failed ===');
    console.error(error);
    process.exit(1);
  });
