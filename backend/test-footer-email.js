const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testFooterEmail() {
  const prisma = new PrismaClient();

  try {
    console.log('=== Footer Email Configuration Test ===\n');

    // Get footer settings from database
    const footerSettings = await prisma.footerSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    console.log('Footer Settings from Database:');
    if (footerSettings) {
      console.log('  - Contact Email:', footerSettings.contactEmail || '[NOT SET]');
      console.log('  - Contact Phone:', footerSettings.contactPhone || '[NOT SET]');
      console.log('  - Copyright:', footerSettings.copyrightText);
    } else {
      console.log('  - No footer settings found in database');
    }

    console.log('\nEnvironment Variables:');
    console.log('  - SMTP_USER:', process.env.SMTP_USER || '[NOT SET]');
    console.log('  - SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '[SET]' : '[NOT SET]');

    // Determine what SMTP user would be used
    const smtpUser = footerSettings?.contactEmail || process.env.SMTP_USER || 'DEFAULT_FROM';
    console.log('\nResolved SMTP User:', smtpUser);

    // Check if it's a valid email format
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    const isValidEmail = emailRegex.test(smtpUser);
    console.log('Is Valid Email Format:', isValidEmail);

    if (!isValidEmail) {
      console.log('\n❌ ISSUE: SMTP user is not a valid email address');
    } else if (smtpUser === 'info@alacraft.com') {
      console.log('\n⚠️  ISSUE: SMTP user is the seeded email (info@alacraft.com) but this is not a real Gmail account');
      console.log('   You need to either:');
      console.log('   1. Update footer settings to use a real Gmail account, OR');
      console.log('   2. Update SMTP_USER in .env to match the Gmail account for the app password');
    } else if (smtpUser === 'your-email@gmail.com') {
      console.log('\n⚠️  ISSUE: SMTP user is the placeholder email from .env');
      console.log('   You need to update SMTP_USER in .env to a real Gmail account');
    } else {
      console.log('\n✅ SMTP user looks like a real email address');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFooterEmail();