# PDF Generation System Troubleshooting Guide

## Overview

This guide covers common issues, error scenarios, and solutions for the PDF generation system. It includes diagnostic steps, performance optimization, and recovery procedures.

## Common Issues and Solutions

### 1. Puppeteer Launch Failures

#### Symptoms
- Error: "Failed to launch the browser process"
- Error: "No usable sandbox!"
- PDF generation timeouts

#### Causes
- Missing system dependencies
- Insufficient permissions
- Memory limitations
- Incorrect Chrome/Chromium path

#### Solutions

**Linux/Ubuntu Dependencies:**
```bash
# Install required dependencies
sudo apt-get update
sudo apt-get install -y \
  gconf-service \
  libasound2 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgcc1 \
  libgconf-2-4 \
  libgdk-pixbuf2.0-0 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  ca-certificates \
  fonts-liberation \
  libappindicator1 \
  libnss3 \
  lsb-release \
  xdg-utils \
  wget
```

**Alpine Linux Dependencies:**
```bash
# For Alpine-based Docker containers
apk add --no-cache \
  chromium \
  nss \
  freetype \
  freetype-dev \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  ttf-dejavu \
  ttf-droid \
  ttf-liberation
```

**Environment Configuration:**
```bash
# Set Puppeteer environment variables
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
export PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox"
```

**Docker Configuration:**
```dockerfile
# Add to Dockerfile
RUN apt-get update && apt-get install -y \
    chromium-browser \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

#### Diagnostic Commands

```bash
# Test Puppeteer installation
node -e "const puppeteer = require('puppeteer'); puppeteer.launch().then(() => console.log('OK')).catch(console.error);"

# Check Chrome/Chromium installation
which chromium-browser
which google-chrome
chromium-browser --version

# Test with minimal args
node -e "
const puppeteer = require('puppeteer');
puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
}).then(() => console.log('Launch successful')).catch(console.error);
"
```

### 2. PDF Generation Errors

#### Symptoms
- Empty or corrupted PDF files
- Missing content in PDFs
- Formatting issues
- Image loading failures

#### Common Error Messages
```
Error: Protocol error (Page.printToPDF): Printing failed
Error: Navigation timeout of 30000 ms exceeded
Error: net::ERR_FAILED at about:blank
```

#### Solutions

**Template Validation:**
```typescript
// Add template validation
const validateTemplate = (htmlContent: string): boolean => {
  // Check for required elements
  const requiredElements = [
    '<html',
    '<head',
    '<body',
    '</html>',
  ];

  return requiredElements.every(element =>
    htmlContent.includes(element)
  );
};

// Validate before PDF generation
if (!validateTemplate(htmlContent)) {
  throw new Error('Invalid HTML template structure');
}
```

**Image Loading Issues:**
```typescript
// Add image error handling
const handleImageErrors = (htmlContent: string): string => {
  return htmlContent.replace(
    /<img([^>]*?)src="([^"]*?)"([^>]*?)>/g,
    (match, before, src, after) => {
      return `<img${before}src="${src}"${after} onerror="this.style.display='none';">`;
    }
  );
};
```

**Network Timeout Configuration:**
```typescript
// Increase timeouts for slow networks
await page.setContent(htmlContent, {
  waitUntil: 'networkidle0',
  timeout: 60000, // 60 seconds
});

// Add retry logic
const generatePDFWithRetry = async (htmlContent: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await page.pdf(pdfOptions);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### 3. Memory Issues

#### Symptoms
- Out of memory errors
- Slow PDF generation
- Browser crashes
- System freezes

#### Solutions

**Memory Optimization:**
```typescript
// Configure memory limits
const puppeteerOptions = {
  args: [
    '--max-old-space-size=4096',
    '--memory-pressure-off',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-images', // If images not needed
  ],
};

// Implement browser pooling
class BrowserPool {
  private browsers: puppeteer.Browser[] = [];
  private maxSize = 3;

  async getBrowser(): Promise<puppeteer.Browser> {
    if (this.browsers.length > 0) {
      return this.browsers.pop()!;
    }
    return await puppeteer.launch(puppeteerOptions);
  }

  async returnBrowser(browser: puppeteer.Browser): Promise<void> {
    if (this.browsers.length < this.maxSize) {
      this.browsers.push(browser);
    } else {
      await browser.close();
    }
  }
}
```

**Memory Monitoring:**
```typescript
// Monitor memory usage
const monitorMemory = () => {
  const usage = process.memoryUsage();
  console.log({
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
    external: Math.round(usage.external / 1024 / 1024) + 'MB',
  });
};

// Force garbage collection
if (global.gc) {
  global.gc();
}
```

### 4. Storage Issues

#### Symptoms
- "No space left on device" errors
- File permission errors
- Cleanup failures
- Storage capacity warnings

#### Solutions

**Storage Monitoring:**
```typescript
// Check disk space
import { execSync } from 'child_process';

const checkDiskSpace = (path: string) => {
  try {
    const output = execSync(`df -h ${path}`).toString();
    const lines = output.split('\n');
    const data = lines[1].split(/\s+/);
    return {
      total: data[1],
      used: data[2],
      available: data[3],
      percentage: data[4],
    };
  } catch (error) {
    console.error('Failed to check disk space:', error);
    return null;
  }
};
```

**Cleanup Optimization:**
```typescript
// Enhanced cleanup service
class EnhancedCleanupService {
  async emergencyCleanup(): Promise<void> {
    const uploadDir = 'uploads/pdfs';
    const files = await fs.promises.readdir(uploadDir);

    // Sort by modification time (oldest first)
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(uploadDir, file);
        const stats = await fs.promises.stat(filePath);
        return { file, path: filePath, mtime: stats.mtime };
      })
    );

    fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

    // Remove oldest 50% of files
    const filesToRemove = fileStats.slice(0, Math.floor(fileStats.length / 2));

    for (const { path: filePath } of filesToRemove) {
      try {
        await fs.promises.unlink(filePath);
        console.log(`Emergency cleanup: removed ${filePath}`);
      } catch (error) {
        console.error(`Failed to remove ${filePath}:`, error);
      }
    }
  }
}
```

**Permission Fixes:**
```bash
# Fix file permissions
sudo chown -R app:app uploads/pdfs
sudo chmod -R 755 uploads/pdfs
sudo chmod -R 644 uploads/pdfs/*.pdf

# Set proper umask
umask 022
```

### 5. Email Attachment Issues

#### Symptoms
- Emails sent without attachments
- Attachment size errors
- SMTP delivery failures
- Encoding issues

#### Solutions

**Attachment Size Validation:**
```typescript
// Check attachment size before sending
const validateAttachmentSize = (filePath: string, maxSize: number): boolean => {
  const stats = fs.statSync(filePath);
  if (stats.size > maxSize) {
    console.warn(`Attachment too large: ${stats.size} bytes (max: ${maxSize})`);
    return false;
  }
  return true;
};

// Compress large attachments
const compressAttachment = async (filePath: string): Promise<string> => {
  const compressedPath = filePath.replace('.pdf', '-compressed.pdf');
  // Implement PDF compression logic
  return compressedPath;
};
```

**SMTP Configuration:**
```typescript
// Enhanced SMTP configuration
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // For self-signed certificates
  },
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
};
```

**Retry Logic:**
```typescript
// Implement email retry with exponential backoff
const sendEmailWithRetry = async (
  emailData: any,
  maxRetries = 3
): Promise<EmailSendResult> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.emailService.sendEmail(emailData);
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Email attempt ${attempt} failed, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};
```

## Performance Issues

### Slow PDF Generation

#### Diagnostic Steps

1. **Check System Resources:**
```bash
# Monitor CPU and memory usage
top -p $(pgrep -f "node.*pdf")
htop

# Check I/O wait
iostat -x 1

# Monitor disk usage
iotop
```

2. **Profile PDF Generation:**
```typescript
// Add performance profiling
const profilePDFGeneration = async (orderData: OrderPDFData) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  try {
    const result = await this.generateOrderPDF(orderData);

    const endTime = Date.now();
    const endMemory = process.memoryUsage();

    console.log('PDF Generation Profile:', {
      duration: endTime - startTime,
      memoryDelta: {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      },
      fileSize: result.fileSize,
    });

    return result;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};
```

#### Optimization Strategies

1. **Template Optimization:**
```typescript
// Optimize CSS for faster rendering
const optimizeCSS = (css: string): string => {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Minimize whitespace
    .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
    .trim();
};

// Precompile templates
const templateCache = new Map<string, string>();

const getCompiledTemplate = (templateKey: string, data: any): string => {
  if (!templateCache.has(templateKey)) {
    const template = this.compileTemplate(templateKey);
    templateCache.set(templateKey, template);
  }
  return templateCache.get(templateKey)!;
};
```

2. **Image Optimization:**
```typescript
// Optimize images before including in PDF
const optimizeImage = async (imageUrl: string): Promise<string> => {
  // Implement image compression and resizing
  const optimizedUrl = await this.imageOptimizer.optimize(imageUrl, {
    maxWidth: 400,
    maxHeight: 300,
    quality: 0.8,
    format: 'jpeg',
  });
  return optimizedUrl;
};
```

3. **Concurrent Processing:**
```typescript
// Process multiple PDFs concurrently with limits
import pLimit from 'p-limit';

const limit = pLimit(3); // Maximum 3 concurrent PDF generations

const generateMultiplePDFs = async (orders: OrderPDFData[]) => {
  const promises = orders.map(order =>
    limit(() => this.generateOrderPDF(order))
  );

  return await Promise.allSettled(promises);
};
```

## Error Monitoring and Alerting

### Error Tracking Setup

```typescript
// Enhanced error tracking
class PDFErrorTracker {
  private errorCounts = new Map<string, number>();
  private errorThresholds = {
    puppeteerLaunch: 5,
    pdfGeneration: 10,
    storageError: 3,
    emailDelivery: 15,
  };

  trackError(errorType: string, error: Error): void {
    const count = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, count + 1);

    // Log error details
    console.error(`PDF Error [${errorType}]:`, {
      message: error.message,
      stack: error.stack,
      count: count + 1,
      timestamp: new Date().toISOString(),
    });

    // Check if threshold exceeded
    if (count + 1 >= this.errorThresholds[errorType]) {
      this.sendAlert(errorType, count + 1);
    }
  }

  private sendAlert(errorType: string, count: number): void {
    // Implement alerting logic (email, Slack, etc.)
    console.error(`ALERT: ${errorType} error threshold exceeded (${count} errors)`);
  }
}
```

### Health Check Implementation

```typescript
// Comprehensive health check
@Controller('pdf-generator')
export class PDFHealthController {
  @Get('health')
  async checkHealth(): Promise<any> {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {},
    };

    try {
      // Check Puppeteer
      health.checks.puppeteer = await this.checkPuppeteer();

      // Check storage
      health.checks.storage = await this.checkStorage();

      // Check memory
      health.checks.memory = this.checkMemory();

      // Check recent errors
      health.checks.errors = this.checkRecentErrors();

      // Overall status
      const hasFailures = Object.values(health.checks)
        .some((check: any) => check.status !== 'healthy');

      health.status = hasFailures ? 'unhealthy' : 'healthy';

    } catch (error) {
      health.status = 'error';
      health.error = error.message;
    }

    return health;
  }

  private async checkPuppeteer(): Promise<any> {
    try {
      const browser = await puppeteer.launch({ headless: true });
      await browser.close();
      return { status: 'healthy', message: 'Puppeteer launch successful' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }

  private async checkStorage(): Promise<any> {
    try {
      const uploadDir = 'uploads/pdfs';
      const stats = await fs.promises.stat(uploadDir);

      if (!stats.isDirectory()) {
        return { status: 'unhealthy', message: 'Upload directory not found' };
      }

      // Check write permissions
      const testFile = path.join(uploadDir, 'health-check.tmp');
      await fs.promises.writeFile(testFile, 'test');
      await fs.promises.unlink(testFile);

      return { status: 'healthy', message: 'Storage accessible' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }

  private checkMemory(): any {
    const usage = process.memoryUsage();
    const totalMB = Math.round(usage.rss / 1024 / 1024);
    const heapMB = Math.round(usage.heapUsed / 1024 / 1024);

    const isHealthy = totalMB < 1024 && heapMB < 512; // Thresholds

    return {
      status: isHealthy ? 'healthy' : 'warning',
      totalMemoryMB: totalMB,
      heapMemoryMB: heapMB,
    };
  }
}
```

## Recovery Procedures

### System Recovery

1. **Service Restart:**
```bash
# Restart PDF generation service
sudo systemctl restart pdf-generator

# Or with PM2
pm2 restart pdf-generator

# Or with Docker
docker restart pdf-generator-container
```

2. **Clear Stuck Processes:**
```bash
# Find and kill stuck Puppeteer processes
ps aux | grep chromium | grep -v grep | awk '{print $2}' | xargs kill -9

# Clear temporary files
find uploads/pdfs -name "*.tmp" -delete
find uploads/pdfs -name "*.partial" -delete
```

3. **Storage Recovery:**
```bash
# Emergency storage cleanup
find uploads/pdfs -type f -mtime +1 -delete

# Fix permissions
sudo chown -R app:app uploads/pdfs
sudo chmod -R 755 uploads/pdfs
```

### Data Recovery

```typescript
// Recover failed PDF generations
class PDFRecoveryService {
  async recoverFailedGenerations(): Promise<void> {
    const failedOrders = await this.getFailedOrders();

    for (const order of failedOrders) {
      try {
        console.log(`Recovering PDF for order ${order.orderNumber}`);
        await this.pdfGenerator.generateOrderPDF(order.data, order.locale);
        await this.markOrderRecovered(order.id);
      } catch (error) {
        console.error(`Recovery failed for order ${order.orderNumber}:`, error);
      }
    }
  }

  private async getFailedOrders(): Promise<any[]> {
    // Query database for orders with failed PDF generation
    return [];
  }

  private async markOrderRecovered(orderId: string): Promise<void> {
    // Update order status in database
  }
}
```

This troubleshooting guide provides comprehensive coverage of common issues and their solutions, helping maintain a stable and performant PDF generation system.