#!/usr/bin/env node

// Load environment variables before starting the standalone server
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

// Start the standalone server
require('./.next/standalone/server.js');