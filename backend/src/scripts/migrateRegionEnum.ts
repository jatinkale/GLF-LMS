import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateRegionEnum() {
  console.log('Starting region enum migration...\n');

  try {
    // Step 1: Temporarily change region column to VARCHAR to allow value updates
    console.log('1. Converting region column to VARCHAR...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users
      MODIFY COLUMN region VARCHAR(10) NOT NULL DEFAULT 'INDIA'
    `);
    console.log('   ✓ Converted to VARCHAR\n');

    // Step 2: Update the values
    console.log('2. Updating region values...');
    const indiaCount = await prisma.$executeRawUnsafe(`
      UPDATE users SET region = 'IND' WHERE region = 'INDIA'
    `);
    console.log(`   ✓ Updated ${indiaCount} record(s): INDIA -> IND`);

    const usaCount = await prisma.$executeRawUnsafe(`
      UPDATE users SET region = 'US' WHERE region = 'USA'
    `);
    console.log(`   ✓ Updated ${usaCount} record(s): USA -> US\n`);

    // Step 3: Convert back to ENUM with new values
    console.log('3. Converting region column back to ENUM with new values...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users
      MODIFY COLUMN region ENUM('IND', 'US') NOT NULL DEFAULT 'IND'
    `);
    console.log('   ✓ Converted to ENUM(\'IND\', \'US\')\n');

    // Step 4: Handle leave_process_history table (if it has data)
    console.log('4. Migrating leave_process_history table...');
    const historyCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM leave_process_history` as any[];

    if (historyCount[0].count > 0) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE leave_process_history
        MODIFY COLUMN region VARCHAR(10) NOT NULL
      `);

      await prisma.$executeRawUnsafe(`
        UPDATE leave_process_history SET region = 'IND' WHERE region = 'INDIA'
      `);

      await prisma.$executeRawUnsafe(`
        UPDATE leave_process_history SET region = 'US' WHERE region = 'USA'
      `);

      await prisma.$executeRawUnsafe(`
        ALTER TABLE leave_process_history
        MODIFY COLUMN region ENUM('IND', 'US') NOT NULL
      `);
      console.log('   ✓ Migrated leave_process_history table\n');
    } else {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE leave_process_history
        MODIFY COLUMN region ENUM('IND', 'US') NOT NULL
      `);
      console.log('   ✓ Updated leave_process_history table (no data to migrate)\n');
    }

    // Step 5: Verify the migration
    console.log('5. Verifying migration...');
    const users = await prisma.$queryRaw`SELECT region, COUNT(*) as count FROM users GROUP BY region` as any[];
    console.log('   Users by region:');
    users.forEach((row: any) => {
      console.log(`     ${row.region}: ${row.count} user(s)`);
    });

    console.log('\n✓✓✓ Migration completed successfully! ✓✓✓');
    console.log('\nYou can now run: npx prisma db push\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateRegionEnum()
  .then(() => {
    console.log('=== Migration script finished ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('=== Migration script failed ===');
    console.error(error);
    process.exit(1);
  });
