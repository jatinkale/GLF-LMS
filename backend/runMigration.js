const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'lms_admin',
    password: 'Password-1234',
    database: 'glf_lms_dev',
    multipleStatements: true
  });

  try {
    console.log('Connected to database...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migration_leavetype_pk.sql'),
      'utf8'
    );

    console.log('Running migration...');
    await connection.query(migrationSQL);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
