const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearUsers() {
  try {
    console.log('Starting to clear users...\n');

    // Get all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      }
    });

    console.log('Total users before cleanup:', allUsers.length);
    console.log('\nCurrent users:');
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}`);
    });

    // Delete all users except admin@golivefaster.com
    const result = await prisma.user.deleteMany({
      where: {
        email: {
          not: 'admin@golivefaster.com'
        }
      }
    });

    console.log('\n✓ Deleted', result.count, 'user(s)');

    // Get remaining users
    const remainingUsers = await prisma.user.findMany({
      select: {
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      }
    });

    console.log('\nRemaining users:', remainingUsers.length);
    remainingUsers.forEach(user => {
      console.log(`- ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}`);
    });

    console.log('\n✓ User cleanup completed successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearUsers();
