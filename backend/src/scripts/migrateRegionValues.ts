import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateRegionValues() {
  console.log('Starting region values migration...\n');

  try {
    // Step 1: Update users table - INDIA -> IND, USA -> US
    console.log('1. Migrating users table...');

    // Using raw SQL to update enum values
    await prisma.$executeRaw`UPDATE users SET region = 'IND' WHERE region = 'INDIA'`;
    const indiaUsersUpdated = await prisma.$executeRaw`SELECT ROW_COUNT()` as any;
    console.log(`   ✓ Updated INDIA -> IND`);

    await prisma.$executeRaw`UPDATE users SET region = 'US' WHERE region = 'USA'`;
    const usaUsersUpdated = await prisma.$executeRaw`SELECT ROW_COUNT()` as any;
    console.log(`   ✓ Updated USA -> US`);

    // Step 2: Update leave_process_history table
    console.log('\n2. Migrating leave_process_history table...');

    await prisma.$executeRaw`UPDATE leave_process_history SET region = 'IND' WHERE region = 'INDIA'`;
    console.log(`   ✓ Updated INDIA -> IND`);

    await prisma.$executeRaw`UPDATE leave_process_history SET region = 'US' WHERE region = 'USA'`;
    console.log(`   ✓ Updated USA -> US`);

    // Step 3: Verify the migration
    console.log('\n3. Verifying migration...');

    const users = await prisma.$queryRaw`SELECT region, COUNT(*) as count FROM users GROUP BY region` as any[];
    console.log('   Users by region:');
    users.forEach((row: any) => {
      console.log(`     ${row.region}: ${row.count} users`);
    });

    console.log('\n✓ Migration completed successfully!');
    console.log('\nYou can now run: npx prisma db push\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateRegionValues()
  .then(() => {
    console.log('=== Migration script finished ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('=== Migration script failed ===');
    console.error(error);
    process.exit(1);
  });
