const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('Resetting admin password...\n');

    const adminEmail = 'admin@golivefaster.com';
    const newPassword = 'Admin#123';

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update admin user password
    const admin = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        password: hashedPassword,
        mustChangePassword: false  // Allow login without password change requirement
      }
    });

    console.log('✓ Admin password reset successfully!\n');
    console.log('=== Admin Credentials ===');
    console.log('Email:', admin.email);
    console.log('Password:', newPassword);
    console.log('Employee ID:', admin.employeeId);
    console.log('Role:', admin.role);
    console.log('\nYou can now login with these credentials.');

  } catch (error) {
    console.error('Error resetting password:', error);
    if (error.code === 'P2025') {
      console.error('\nAdmin user not found. Please run setupAdmin.js first.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
