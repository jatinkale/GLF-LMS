import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncLocationToRegion() {
  try {
    console.log('Starting location to region sync...');

    // Get all employees
    const employees = await prisma.employee.findMany({
      select: {
        employeeId: true,
        location: true,
        lmsUserCreated: true,
      },
    });

    console.log(`Found ${employees.length} employees`);

    let syncedCount = 0;
    let skippedCount = 0;

    for (const employee of employees) {
      // Skip if no LMS user
      if (!employee.lmsUserCreated) {
        console.log(`Skipping ${employee.employeeId} - No LMS user`);
        skippedCount++;
        continue;
      }

      // Check if LMS user exists
      const lmsUser = await prisma.user.findUnique({
        where: { employeeId: employee.employeeId },
        select: { employeeId: true, region: true },
      });

      if (!lmsUser) {
        console.log(`Skipping ${employee.employeeId} - LMS user not found in User table`);
        skippedCount++;
        continue;
      }

      // Map location to region
      let region: 'IND' | 'US' | null = null;
      if (employee.location) {
        const locationUpper = employee.location.toUpperCase();
        if (locationUpper.includes('IND') || locationUpper.includes('INDIA')) {
          region = 'IND';
        } else if (locationUpper.includes('US') || locationUpper.includes('USA') || locationUpper.includes('AMERICA')) {
          region = 'US';
        }
      }

      // Update if region is different
      if (region && lmsUser.region !== region) {
        await prisma.user.update({
          where: { employeeId: employee.employeeId },
          data: { region },
        });
        console.log(`✓ Synced ${employee.employeeId}: location="${employee.location}" -> region="${region}" (was: ${lmsUser.region})`);
        syncedCount++;
      } else {
        console.log(`- ${employee.employeeId}: Already in sync (location="${employee.location}", region="${lmsUser.region}")`);
        skippedCount++;
      }
    }

    console.log('\nSync complete!');
    console.log(`Synced: ${syncedCount}`);
    console.log(`Skipped: ${skippedCount}`);
  } catch (error) {
    console.error('Error syncing location to region:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

syncLocationToRegion();
