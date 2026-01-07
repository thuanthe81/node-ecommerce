/**
 * Script to set or update a user's password via command line
 * Usage: npm run script:set-password <email|userId> <password>
 *
 * Examples:
 *   npm run script:set-password user@example.com newpassword123
 *   npm run script:set-password 550e8400-e29b-41d4-a716-446655440000 newpassword123
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function showUsage() {
  console.log('\nUser Password Setting Script');
  console.log('============================');
  console.log('\nUsage:');
  console.log('  npm run script:set-password <email|userId> <password>');
  console.log('\nExamples:');
  console.log('  npm run script:set-password user@example.com newpassword123');
  console.log('  npm run script:set-password 550e8400-e29b-41d4-a716-446655440000 newpassword123');
  console.log('\nArguments:');
  console.log('  email|userId  - User email address or UUID to identify the user');
  console.log('  password      - New password to set for the user');
  console.log('\nOptions:');
  console.log('  --help, -h    - Show this help message');
  console.log('');
}

function validatePassword(password: string): boolean {
  if (!password || password.trim().length === 0) {
    console.error('❌ Error: Password cannot be empty');
    return false;
  }

  if (password.length < 6) {
    console.error('❌ Error: Password must be at least 6 characters long');
    return false;
  }

  return true;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

async function setUserPassword(userIdentifier: string, password: string) {
  console.log('Setting user password...\n');

  try {
    // Validate password
    if (!validatePassword(password)) {
      process.exit(1);
    }

    // Determine if identifier is email or UUID
    let user;
    if (isValidEmail(userIdentifier)) {
      console.log(`🔍 Looking up user by email: ${userIdentifier}`);
      user = await prisma.user.findUnique({
        where: { email: userIdentifier },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          passwordHash: true,
          googleId: true,
          facebookId: true,
        },
      });
    } else if (isValidUUID(userIdentifier)) {
      console.log(`🔍 Looking up user by ID: ${userIdentifier}`);
      user = await prisma.user.findUnique({
        where: { id: userIdentifier },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          passwordHash: true,
          googleId: true,
          facebookId: true,
        },
      });
    } else {
      console.error('❌ Error: Invalid user identifier. Must be a valid email address or UUID');
      process.exit(1);
    }

    if (!user) {
      console.error('❌ Error: User not found');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`);

    // Check if user is OAuth-only
    const isOAuthUser = (user.googleId || user.facebookId) && !user.passwordHash;
    if (isOAuthUser) {
      console.log('ℹ️  Note: This is an OAuth user. Setting password will allow them to login with email/password as well.');
    }

    // Hash the new password
    console.log('🔐 Hashing password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user's password
    console.log('💾 Updating password in database...');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
      },
    });

    console.log('✅ Password updated successfully!');
    console.log(`📧 User: ${user.email}`);
    console.log(`👤 Name: ${user.firstName} ${user.lastName}`);

    if (isOAuthUser) {
      console.log('🔗 User can now login with both OAuth and email/password');
    }

  } catch (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('Script started with args:', process.argv);
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  // Validate arguments
  if (args.length !== 2) {
    console.error('❌ Error: Invalid number of arguments');
    showUsage();
    process.exit(1);
  }

  const [userIdentifier, password] = args;

  await setUserPassword(userIdentifier, password);
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});