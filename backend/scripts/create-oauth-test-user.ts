/**
 * Script to create a test user with OAuth provider information
 * This helps verify that OAuth data is properly displayed in the admin interface
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createOAuthTestUser() {
  console.log('Creating test users with OAuth provider information...\n');

  try {
    // Create a user with Google OAuth
    const googleUser = await prisma.user.upsert({
      where: { email: 'google-test@example.com' },
      update: {
        googleId: 'google-test-id-123456',
        username: 'googleuser123',
        firstName: 'Google',
        lastName: 'User',
        isEmailVerified: true,
      },
      create: {
        email: 'google-test@example.com',
        googleId: 'google-test-id-123456',
        username: 'googleuser123',
        firstName: 'Google',
        lastName: 'User',
        role: 'CUSTOMER',
        isEmailVerified: true,
        passwordHash: null,
      },
    });
    console.log('✅ Created Google OAuth test user:', googleUser.email);

    // Create a user with Facebook OAuth
    const facebookUser = await prisma.user.upsert({
      where: { email: 'facebook-test@example.com' },
      update: {
        facebookId: 'facebook-test-id-789012',
        username: 'facebookuser456',
        firstName: 'Facebook',
        lastName: 'User',
        isEmailVerified: true,
      },
      create: {
        email: 'facebook-test@example.com',
        facebookId: 'facebook-test-id-789012',
        username: 'facebookuser456',
        firstName: 'Facebook',
        lastName: 'User',
        role: 'CUSTOMER',
        isEmailVerified: true,
        passwordHash: null,
      },
    });
    console.log('✅ Created Facebook OAuth test user:', facebookUser.email);

    // Create a user with both Google and Facebook OAuth (linked accounts)
    const multiProviderUser = await prisma.user.upsert({
      where: { email: 'multi-oauth-test@example.com' },
      update: {
        googleId: 'google-multi-id-345678',
        facebookId: 'facebook-multi-id-901234',
        username: 'multiuser789',
        firstName: 'Multi',
        lastName: 'Provider',
        isEmailVerified: true,
      },
      create: {
        email: 'multi-oauth-test@example.com',
        googleId: 'google-multi-id-345678',
        facebookId: 'facebook-multi-id-901234',
        username: 'multiuser789',
        firstName: 'Multi',
        lastName: 'Provider',
        role: 'CUSTOMER',
        isEmailVerified: true,
        passwordHash: null,
      },
    });
    console.log('✅ Created multi-provider OAuth test user:', multiProviderUser.email);

    console.log('\n✅ Test users created successfully!');
    console.log('\nYou can now verify OAuth visibility in the admin interface:');
    console.log('1. Log in to the admin panel');
    console.log('2. Navigate to Customer Management');
    console.log('3. You should see OAuth provider badges for these test users');
    console.log('4. Click on a user to see detailed OAuth information');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createOAuthTestUser();
