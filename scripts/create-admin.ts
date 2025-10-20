import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Admin user details
    const adminEmail = 'admin@fontmaker.com';
    const adminPassword = 'Admin123!'; // You should change this after first login
    const adminUsername = 'admin';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('Email:', adminEmail);
      console.log('Username:', adminUsername);
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        displayName: 'Administrator',
        passwordHash: passwordHash,
        subscriptionTier: 'BUSINESS', // Highest tier
        tokensRemaining: 999999, // Unlimited tokens
        emailVerified: new Date(),
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Username:', adminUsername);
    console.log('Tokens:', admin.tokensRemaining);
    console.log('Tier:', admin.subscriptionTier);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
