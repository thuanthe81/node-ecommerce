#!/usr/bin/env node

/**
 * Production Deployment Checklist Script
 * Validates environment configuration and readiness for SSR deployment
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class DeploymentChecker {
  constructor() {
    this.checks = [];
    this.warnings = [];
    this.errors = [];
  }

  /**
   * Run all deployment checks
   */
  async runAllChecks() {
    console.log('🚀 Running SSR Production Deployment Checklist...\n');

    // Environment checks
    await this.checkEnvironmentVariables();
    await this.checkNextJsConfiguration();
    await this.checkPackageConfiguration();

    // Security checks
    await this.checkSecurityConfiguration();

    // Performance checks
    await this.checkPerformanceConfiguration();

    // SEO checks
    await this.checkSEOConfiguration();

    // Monitoring checks
    await this.checkMonitoringConfiguration();

    // File checks
    await this.checkRequiredFiles();

    // API connectivity checks
    await this.checkAPIConnectivity();

    // Generate report
    this.generateReport();
  }

  /**
   * Check environment variables
   */
  async checkEnvironmentVariables() {
    console.log('📋 Checking Environment Variables...');

    const requiredVars = [
      'NEXT_PUBLIC_SITE_URL',
      'NEXT_PUBLIC_API_URL',
      'NODE_ENV',
    ];

    const recommendedVars = [
      'ENABLE_PERF_MONITORING',
      'PERFORMANCE_ALERT_WEBHOOK',
      'SENTRY_DSN',
      'DATABASE_URL',
      'REDIS_URL',
    ];

    // Check required variables
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        this.addCheck(`✅ ${varName} is set`);
      } else {
        this.addError(`❌ Required environment variable ${varName} is missing`);
      }
    }

    // Check recommended variables
    for (const varName of recommendedVars) {
      if (process.env[varName]) {
        this.addCheck(`✅ ${varName} is configured`);
      } else {
        this.addWarning(`⚠️  Recommended environment variable ${varName} is not set`);
      }
    }

    // Validate URLs
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      if (process.env.NEXT_PUBLIC_SITE_URL.startsWith('https://')) {
        this.addCheck('✅ Site URL uses HTTPS');
      } else {
        this.addWarning('⚠️  Site URL should use HTTPS in production');
      }
    }

    console.log('   Environment variables check completed\n');
  }

  /**
   * Check Next.js configuration
   */
  async checkNextJsConfiguration() {
    console.log('⚙️  Checking Next.js Configuration...');

    const configPath = path.join(process.cwd(), 'next.config.ts');

    if (fs.existsSync(configPath)) {
      this.addCheck('✅ next.config.ts exists');

      const configContent = fs.readFileSync(configPath, 'utf8');

      // Check for important configurations
      if (configContent.includes('compress: true')) {
        this.addCheck('✅ Compression is enabled');
      } else {
        this.addWarning('⚠️  Consider enabling compression for better performance');
      }

      if (configContent.includes('poweredByHeader: false')) {
        this.addCheck('✅ X-Powered-By header is disabled');
      } else {
        this.addWarning('⚠️  Consider disabling X-Powered-By header for security');
      }

      if (configContent.includes('images:')) {
        this.addCheck('✅ Image optimization is configured');
      } else {
        this.addWarning('⚠️  Image optimization configuration not found');
      }

    } else {
      this.addError('❌ next.config.ts not found');
    }

    console.log('   Next.js configuration check completed\n');
  }

  /**
   * Check package configuration
   */
  async checkPackageConfiguration() {
    console.log('📦 Checking Package Configuration...');

    const packagePath = path.join(process.cwd(), 'package.json');

    if (fs.existsSync(packagePath)) {
      this.addCheck('✅ package.json exists');

      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // Check for build script
      if (packageJson.scripts && packageJson.scripts.build) {
        this.addCheck('✅ Build script is configured');
      } else {
        this.addError('❌ Build script is missing');
      }

      // Check for start script
      if (packageJson.scripts && packageJson.scripts.start) {
        this.addCheck('✅ Start script is configured');
      } else {
        this.addError('❌ Start script is missing');
      }

      // Check for essential dependencies
      const essentialDeps = ['next', 'react', 'react-dom'];
      for (const dep of essentialDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.addCheck(`✅ ${dep} dependency found`);
        } else {
          this.addError(`❌ Essential dependency ${dep} is missing`);
        }
      }

    } else {
      this.addError('❌ package.json not found');
    }

    console.log('   Package configuration check completed\n');
  }

  /**
   * Check security configuration
   */
  async checkSecurityConfiguration() {
    console.log('🔒 Checking Security Configuration...');

    // Check for security headers in next.config.ts
    const configPath = path.join(process.cwd(), 'next.config.ts');

    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');

      if (configContent.includes('X-Frame-Options')) {
        this.addCheck('✅ X-Frame-Options header configured');
      } else {
        this.addWarning('⚠️  X-Frame-Options header not configured');
      }

      if (configContent.includes('X-Content-Type-Options')) {
        this.addCheck('✅ X-Content-Type-Options header configured');
      } else {
        this.addWarning('⚠️  X-Content-Type-Options header not configured');
      }

      if (configContent.includes('Referrer-Policy')) {
        this.addCheck('✅ Referrer-Policy header configured');
      } else {
        this.addWarning('⚠️  Referrer-Policy header not configured');
      }
    }

    // Check for HTTPS enforcement
    if (process.env.NODE_ENV === 'production') {
      if (process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://')) {
        this.addCheck('✅ HTTPS is enforced');
      } else {
        this.addError('❌ HTTPS should be enforced in production');
      }
    }

    console.log('   Security configuration check completed\n');
  }

  /**
   * Check performance configuration
   */
  async checkPerformanceConfiguration() {
    console.log('⚡ Checking Performance Configuration...');

    // Check for performance monitoring
    if (process.env.ENABLE_PERF_MONITORING === 'true') {
      this.addCheck('✅ Performance monitoring is enabled');
    } else {
      this.addWarning('⚠️  Performance monitoring is not enabled');
    }

    // Check for cache configuration
    if (process.env.REDIS_URL) {
      this.addCheck('✅ Redis cache is configured');
    } else {
      this.addWarning('⚠️  Redis cache is not configured');
    }

    // Check for CDN configuration
    if (process.env.CDN_URL) {
      this.addCheck('✅ CDN is configured');
    } else {
      this.addWarning('⚠️  CDN is not configured');
    }

    console.log('   Performance configuration check completed\n');
  }

  /**
   * Check SEO configuration
   */
  async checkSEOConfiguration() {
    console.log('🔍 Checking SEO Configuration...');

    // Check for sitemap files
    const sitemapPath = path.join(process.cwd(), 'app', 'sitemap.ts');
    if (fs.existsSync(sitemapPath)) {
      this.addCheck('✅ Sitemap configuration exists');
    } else {
      this.addError('❌ Sitemap configuration is missing');
    }

    // Check for robots.txt
    const robotsPath = path.join(process.cwd(), 'app', 'robots.ts');
    if (fs.existsSync(robotsPath)) {
      this.addCheck('✅ Robots.txt configuration exists');
    } else {
      this.addWarning('⚠️  Robots.txt configuration is missing');
    }

    // Check for structured data utilities
    const structuredDataPath = path.join(process.cwd(), 'lib', 'structured-data.ts');
    if (fs.existsSync(structuredDataPath)) {
      this.addCheck('✅ Structured data utilities exist');
    } else {
      this.addWarning('⚠️  Structured data utilities are missing');
    }

    console.log('   SEO configuration check completed\n');
  }

  /**
   * Check monitoring configuration
   */
  async checkMonitoringConfiguration() {
    console.log('📊 Checking Monitoring Configuration...');

    // Check for production monitoring
    const monitoringPath = path.join(process.cwd(), 'lib', 'production-monitoring.ts');
    if (fs.existsSync(monitoringPath)) {
      this.addCheck('✅ Production monitoring utilities exist');
    } else {
      this.addWarning('⚠️  Production monitoring utilities are missing');
    }

    // Check for health check endpoint
    const healthPath = path.join(process.cwd(), 'app', 'api', 'health', 'route.ts');
    if (fs.existsSync(healthPath)) {
      this.addCheck('✅ Health check endpoint exists');
    } else {
      this.addWarning('⚠️  Health check endpoint is missing');
    }

    // Check for error tracking
    if (process.env.SENTRY_DSN) {
      this.addCheck('✅ Error tracking is configured');
    } else {
      this.addWarning('⚠️  Error tracking is not configured');
    }

    console.log('   Monitoring configuration check completed\n');
  }

  /**
   * Check required files
   */
  async checkRequiredFiles() {
    console.log('📁 Checking Required Files...');

    const requiredFiles = [
      'package.json',
      'next.config.ts',
      'tsconfig.json',
      'app/layout.tsx',
      'app/page.tsx',
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.addCheck(`✅ ${file} exists`);
      } else {
        this.addError(`❌ Required file ${file} is missing`);
      }
    }

    console.log('   Required files check completed\n');
  }

  /**
   * Check API connectivity
   */
  async checkAPIConnectivity() {
    console.log('🌐 Checking API Connectivity...');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      this.addError('❌ API URL is not configured');
      return;
    }

    try {
      const isHealthy = await this.pingAPI(apiUrl);
      if (isHealthy) {
        this.addCheck('✅ API is accessible');
      } else {
        this.addError('❌ API is not accessible');
      }
    } catch (error) {
      this.addError(`❌ API connectivity check failed: ${error.message}`);
    }

    console.log('   API connectivity check completed\n');
  }

  /**
   * Ping API endpoint
   */
  async pingAPI(apiUrl) {
    return new Promise((resolve) => {
      const url = new URL(apiUrl);
      const client = url.protocol === 'https:' ? https : http;

      const req = client.request({
        hostname: url.hostname,
        port: url.port,
        path: '/health',
        method: 'GET',
        timeout: 5000,
      }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => resolve(false));
      req.end();
    });
  }

  /**
   * Add successful check
   */
  addCheck(message) {
    this.checks.push(message);
  }

  /**
   * Add warning
   */
  addWarning(message) {
    this.warnings.push(message);
  }

  /**
   * Add error
   */
  addError(message) {
    this.errors.push(message);
  }

  /**
   * Generate deployment report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 DEPLOYMENT READINESS REPORT');
    console.log('='.repeat(60));

    console.log(`\n✅ Successful Checks: ${this.checks.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS (Must be fixed before deployment):');
      this.errors.forEach(error => console.log(`   ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (Recommended to fix):');
      this.warnings.forEach(warning => console.log(`   ${warning}`));
    }

    console.log('\n✅ SUCCESSFUL CHECKS:');
    this.checks.forEach(check => console.log(`   ${check}`));

    // Overall status
    console.log('\n' + '='.repeat(60));
    if (this.errors.length === 0) {
      console.log('🎉 DEPLOYMENT READY!');
      console.log('All critical checks passed. You can proceed with deployment.');
      if (this.warnings.length > 0) {
        console.log(`Consider addressing ${this.warnings.length} warnings for optimal performance.`);
      }
    } else {
      console.log('🚫 NOT READY FOR DEPLOYMENT');
      console.log(`Please fix ${this.errors.length} critical errors before deploying.`);
      process.exit(1);
    }
    console.log('='.repeat(60));
  }
}

// Run the deployment checker
if (require.main === module) {
  const checker = new DeploymentChecker();
  checker.runAllChecks().catch(error => {
    console.error('Deployment check failed:', error);
    process.exit(1);
  });
}

module.exports = DeploymentChecker;