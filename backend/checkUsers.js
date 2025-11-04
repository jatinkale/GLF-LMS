const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        employeeId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Total users:', users.length);
    console.log('\nAll users:');
    users.forEach(user => {
      console.log('\n---');
      console.log('Email:', user.email);
      console.log('Name:', user.firstName, user.lastName);
      console.log('Employee ID:', user.employeeId);
      console.log('Role:', user.role);
      console.log('Active:', user.isActive);
      console.log('Email Verified:', user.emailVerified);
      console.log('Created:', user.createdAt);
    });

    // Check if jatin@golivefaster.com exists
    const jatin = await prisma.user.findUnique({
      where: { email: 'jatin@golivefaster.com' }
    });

    if (jatin) {
      console.log('\n\n=== User jatin@golivefaster.com found ===');
      console.log('Password hash exists:', !!jatin.password);
      console.log('Password hash length:', jatin.password?.length || 0);
    } else {
      console.log('\n\n=== User jatin@golivefaster.com NOT FOUND ===');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
