#!/usr/bin/env node

/**
 * Script to verify environment variables are loaded correctly
 */
import { config } from 'dotenv';

// Load custom .env file if needed
// config({ path: '.env.custom' });
config({ path: '.env' })
config({ path: '.env.local' })
config({ path: '.env.production' })

console.log('🔍 Environment Variables Check');
console.log('================================');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL}`);
console.log(`NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL}`);
console.log(`NEXT_PUBLIC_DEFAULT_LOCALE: ${process.env.NEXT_PUBLIC_DEFAULT_LOCALE}`);
console.log(`NEXT_TELEMETRY_DISABLED: ${process.env.NEXT_TELEMETRY_DISABLED}`);
console.log(`GENERATE_SOURCEMAP: ${process.env.GENERATE_SOURCEMAP}`);
console.log(`NODE_OPTIONS: ${process.env.NODE_OPTIONS}`);

// Check if required variables are set
const requiredVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_DEFAULT_LOCALE'
];

let allSet = true;
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    allSet = false;
  }
});

if (allSet) {
  console.log('✅ All required environment variables are set');
} else {
  console.log('❌ Some required environment variables are missing');
  process.exit(1);
}