import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncManagerRelationships() {
  console.log('🔄 Starting manager relationship sync...\n');

  try {
    // Get all employees with LMS users
    const allEmployees = await prisma.employee.findMany({
      where: {
        lmsUserCreated: true
      },
      select: {
        employeeId: true,
        reportingManagerId: true,
        firstName: true,
        lastName: true
      }
    });

    // Filter to only those with reporting managers
    const employees = allEmployees.filter(emp => emp.reportingManagerId !== null && emp.reportingManagerId !== '');

    console.log(`Found ${employees.length} employees with reporting managers\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const employee of employees) {
      try {
        // Check if this employee has an LMS user
        const user = await prisma.user.findUnique({
          where: { employeeId: employee.employeeId },
          select: { employeeId: true, managerEmployeeId: true }
        });

        if (!user) {
          console.log(`⚠️  Skipping ${employee.employeeId} (${employee.firstName} ${employee.lastName}) - No LMS user found`);
          skipped++;
          continue;
        }

        // Check if reporting manager has LMS user
        const managerHasLmsUser = await prisma.user.findUnique({
          where: { employeeId: employee.reportingManagerId! },
          select: { employeeId: true, firstName: true, lastName: true }
        });

        if (!managerHasLmsUser) {
          console.log(`⚠️  Skipping ${employee.employeeId} (${employee.firstName} ${employee.lastName}) - Manager ${employee.reportingManagerId} has no LMS account`);
          skipped++;
          continue;
        }

        // Update the user's manager
        await prisma.user.update({
          where: { employeeId: employee.employeeId },
          data: {
            managerEmployeeId: employee.reportingManagerId
          }
        });

        console.log(`✅ Updated ${employee.employeeId} (${employee.firstName} ${employee.lastName}) → Manager: ${employee.reportingManagerId} (${managerHasLmsUser.firstName} ${managerHasLmsUser.lastName})`);
        updated++;

      } catch (error) {
        console.error(`❌ Error updating ${employee.employeeId}:`, error);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📝 Total: ${employees.length}`);

  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncManagerRelationships()
  .then(() => {
    console.log('\n✅ Manager relationship sync complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Manager relationship sync failed!');
    console.error(error);
    process.exit(1);
  });
