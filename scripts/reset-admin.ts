import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdmin() {
  try {
    console.log('🔄 Resetting admin user...');

    const adminEmail = 'admin@happyfont.com';
    const adminPassword = 'Admin2025!';
    const adminUsername = 'admin';

    // Delete existing admin user if exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('🗑️  Deleting existing admin user...');
      await prisma.user.delete({
        where: { email: adminEmail },
      });
    }

    // Also check for old admin email
    const oldAdmin = await prisma.user.findUnique({
      where: { email: 'admin@fontmaker.com' },
    });

    if (oldAdmin) {
      console.log('🗑️  Deleting old admin user...');
      await prisma.user.delete({
        where: { email: 'admin@fontmaker.com' },
      });
    }

    // Create new admin user
    console.log('✨ Creating new admin user...');
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        displayName: 'Administrator',
        passwordHash: passwordHash,
        subscriptionTier: 'BUSINESS',
        tokensRemaining: 999999,
        emailVerified: new Date(),
      },
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Username:', adminUsername);
    console.log('🪙 Tokens:', admin.tokensRemaining);
    console.log('💎 Tier:', admin.subscriptionTier);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Error resetting admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();
