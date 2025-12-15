# PDF Generation System Configuration Guide

## Overview

This guide covers all configuration options for the PDF generation system, including environment variables, service settings, branding customization, and deployment configurations.

## Environment Variables

### Core PDF Settings

```bash
# PDF Generation Configuration
PDF_UPLOAD_DIR=uploads/pdfs                    # Directory for temporary PDF storage
PDF_MAX_STORAGE_SIZE=1073741824               # Maximum storage size (1GB)
PDF_RETENTION_HOURS=24                        # How long to keep PDFs (24 hours)
PDF_CLEANUP_INTERVAL=3600000                  # Cleanup interval (1 hour in ms)
PDF_MAX_FILE_SIZE=10485760                    # Maximum PDF file size (10MB)

# Puppeteer Configuration
PUPPETEER_HEADLESS=true                       # Run in headless mode
PUPPETEER_TIMEOUT=30000                       # PDF generation timeout (30 seconds)
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium   # Custom Chrome path (optional)

# Compression Settings
PDF_COMPRESSION_ENABLED=true                  # Enable PDF compression
PDF_COMPRESSION_QUALITY=0.8                  # Compression quality (0.1-1.0)
PDF_IMAGE_COMPRESSION=true                    # Compress images in PDFs
PDF_IMAGE_MAX_WIDTH=800                       # Maximum image width in pixels
PDF_IMAGE_MAX_HEIGHT=600                      # Maximum image height in pixels

# Performance Settings
PDF_CONCURRENT_LIMIT=3                        # Maximum concurrent PDF generations
PDF_MEMORY_LIMIT=512                          # Memory limit per PDF process (MB)
PDF_BROWSER_POOL_SIZE=2                       # Number of browser instances to pool

# Monitoring and Logging
PDF_AUDIT_ENABLED=true                        # Enable audit logging
PDF_PERFORMANCE_MONITORING=true              # Enable performance monitoring
PDF_DEBUG_MODE=false                          # Enable debug mode
PDF_SAVE_FAILED_PDFS=false                   # Save failed PDFs for debugging
```

### Email Integration Settings

```bash
# Email Attachment Configuration
EMAIL_ATTACHMENT_MAX_SIZE=25165824            # Maximum email attachment size (24MB)
EMAIL_ATTACHMENT_COMPRESSION=true            # Compress attachments
EMAIL_RESEND_RATE_LIMIT=3                    # Maximum resends per hour
EMAIL_RESEND_WINDOW_HOURS=1                  # Rate limit window

# SMTP Settings (for swaks integration)
SMTP_HOST=localhost                           # SMTP server host
SMTP_PORT=587                                 # SMTP server port
SMTP_SECURE=true                             # Use TLS/SSL
SMTP_USER=your-email@domain.com              # SMTP username
SMTP_PASS=your-password                      # SMTP password
```

### Localization Settings

```bash
# Language Configuration
DEFAULT_LOCALE=en                             # Default language (en/vi)
SUPPORTED_LOCALES=en,vi                      # Supported languages
CURRENCY_DEFAULT=USD                         # Default currency
CURRENCY_VI=VND                              # Vietnamese currency
DATE_FORMAT_EN=MM/DD/YYYY                    # English date format
DATE_FORMAT_VI=DD/MM/YYYY                    # Vietnamese date format
```

## Service Configuration

### PDFGeneratorService Configuration

```typescript
// pdf-generator.config.ts
export const pdfGeneratorConfig = {
  // Puppeteer launch options
  puppeteer: {
    headless: process.env.PUPPETEER_HEADLESS === 'true',
    timeout: parseInt(process.env.PUPPETEER_TIMEOUT) || 30000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      `--max-old-space-size=${process.env.PDF_MEMORY_LIMIT || 512}`,
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  },

  // PDF generation options
  pdf: {
    format: 'A4' as const,
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm',
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `,
    tagged: true, // Enable accessibility
  },

  // Performance settings
  performance: {
    concurrentLimit: parseInt(process.env.PDF_CONCURRENT_LIMIT) || 3,
    browserPoolSize: parseInt(process.env.PDF_BROWSER_POOL_SIZE) || 2,
    memoryLimit: parseInt(process.env.PDF_MEMORY_LIMIT) || 512,
  },
};
```

### Document Storage Configuration

```typescript
// document-storage.config.ts
export const documentStorageConfig = {
  uploadDir: process.env.PDF_UPLOAD_DIR || 'uploads/pdfs',
  maxStorageSize: parseInt(process.env.PDF_MAX_STORAGE_SIZE) || 1024 * 1024 * 1024,
  retentionHours: parseInt(process.env.PDF_RETENTION_HOURS) || 24,
  cleanupInterval: parseInt(process.env.PDF_CLEANUP_INTERVAL) || 3600000,
  maxFileSize: parseInt(process.env.PDF_MAX_FILE_SIZE) || 10 * 1024 * 1024,

  // File permissions
  fileMode: 0o644,
  dirMode: 0o755,

  // Security settings
  allowedExtensions: ['.pdf'],
  maxPathLength: 255,
  sanitizeFilenames: true,
};
```

### Compression Configuration

```typescript
// compression.config.ts
export const compressionConfig = {
  enabled: process.env.PDF_COMPRESSION_ENABLED === 'true',
  quality: parseFloat(process.env.PDF_COMPRESSION_QUALITY) || 0.8,

  // Image compression settings
  images: {
    enabled: process.env.PDF_IMAGE_COMPRESSION === 'true',
    maxWidth: parseInt(process.env.PDF_IMAGE_MAX_WIDTH) || 800,
    maxHeight: parseInt(process.env.PDF_IMAGE_MAX_HEIGHT) || 600,
    quality: 0.85,
    format: 'jpeg',
  },

  // Compression levels
  levels: {
    low: {
      quality: 0.9,
      imageQuality: 0.9,
      optimizeFonts: false,
    },
    medium: {
      quality: 0.8,
      imageQuality: 0.8,
      optimizeFonts: true,
    },
    high: {
      quality: 0.6,
      imageQuality: 0.7,
      optimizeFonts: true,
    },
  },
};
```

## Branding Customization

### Brand Colors and Fonts

```typescript
// branding.config.ts
export const brandingConfig = {
  // AlaCraft brand colors
  colors: {
    primary: '#2c3e50',      // Dark blue-gray for headers
    secondary: '#3498db',    // Blue for accents
    text: '#2c3e50',         // Dark text for readability
    background: '#ffffff',   // White background
    border: '#bdc3c7',       // Light gray for borders
    success: '#27ae60',      // Green for success states
    warning: '#f39c12',      // Orange for warnings
    error: '#e74c3c',        // Red for errors
  },

  // Typography
  fonts: {
    primary: 'Arial, sans-serif',
    heading: 'Arial, sans-serif',
    monospace: 'Courier New, monospace',
  },

  // Logo configuration
  logo: {
    maxWidth: 250,
    maxHeight: 80,
    fallbackText: 'AlaCraft',
    position: 'left', // left, center, right
  },

  // Spacing
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
  },

  // Page format
  pageFormat: {
    size: 'A4' as const,
    orientation: 'portrait' as const,
    margins: {
      top: 20,
      right: 15,
      bottom: 20,
      left: 15,
    },
  },
};
```

### Custom CSS Overrides

```typescript
// custom-styles.config.ts
export const customStylesConfig = {
  // Additional CSS for specific customizations
  customCSS: `
    /* Custom header styling */
    .document-header {
      background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
    }

    /* Custom table styling */
    .items-table th {
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    }

    /* Custom payment section */
    .payment-section {
      border-left: 4px solid #3498db;
      padding-left: 16px;
    }

    /* Custom footer */
    .document-footer {
      background-color: #f8f9fa;
      border-radius: 0 0 8px 8px;
    }
  `,

  // Theme variants
  themes: {
    default: 'standard AlaCraft theme',
    minimal: 'clean minimal theme',
    colorful: 'vibrant colorful theme',
  },
};
```

## Localization Configuration

### Translation Files

```typescript
// localization.config.ts
export const localizationConfig = {
  defaultLocale: 'en',
  supportedLocales: ['en', 'vi'],

  // Currency settings
  currencies: {
    en: {
      code: 'USD',
      symbol: '$',
      position: 'before',
      decimals: 2,
    },
    vi: {
      code: 'VND',
      symbol: '₫',
      position: 'after',
      decimals: 0,
    },
  },

  // Date formatting
  dateFormats: {
    en: {
      short: 'MM/DD/YYYY',
      long: 'MMMM DD, YYYY',
      time: 'h:mm A',
    },
    vi: {
      short: 'DD/MM/YYYY',
      long: 'DD MMMM, YYYY',
      time: 'HH:mm',
    },
  },

  // Address formatting
  addressFormats: {
    en: '{addressLine1}\n{addressLine2}\n{city}, {state} {postalCode}\n{country}',
    vi: '{addressLine1}\n{addressLine2}\n{city}, {state} {postalCode}\n{country}',
  },
};
```

### Custom Translations

```typescript
// custom-translations.ts
export const customTranslations = {
  en: {
    // Custom business-specific terms
    'handmade_products': 'Handmade Products',
    'artisan_crafted': 'Artisan Crafted',
    'quality_guarantee': 'Quality Guarantee',
    'custom_order_note': 'This is a custom handmade order',
  },
  vi: {
    'handmade_products': 'Sản phẩm thủ công',
    'artisan_crafted': 'Thủ công nghệ thuật',
    'quality_guarantee': 'Bảo đảm chất lượng',
    'custom_order_note': 'Đây là đơn hàng thủ công tùy chỉnh',
  },
};
```

## Monitoring and Logging Configuration

### Audit Configuration

```typescript
// audit.config.ts
export const auditConfig = {
  enabled: process.env.PDF_AUDIT_ENABLED === 'true',

  // What to log
  logEvents: {
    pdfGeneration: true,
    emailSending: true,
    fileStorage: true,
    cleanup: true,
    errors: true,
  },

  // Log retention
  retention: {
    days: 30,
    maxSize: '100MB',
    compress: true,
  },

  // Log format
  format: {
    timestamp: true,
    level: true,
    context: true,
    metadata: true,
  },
};
```

### Performance Monitoring

```typescript
// monitoring.config.ts
export const monitoringConfig = {
  enabled: process.env.PDF_PERFORMANCE_MONITORING === 'true',

  // Metrics to track
  metrics: {
    pdfGenerationTime: true,
    pdfFileSize: true,
    storageUtilization: true,
    emailDeliveryRate: true,
    errorRate: true,
    memoryUsage: true,
  },

  // Alerting thresholds
  alerts: {
    pdfGenerationTime: 30000, // 30 seconds
    storageUtilization: 0.8,  // 80%
    errorRate: 0.05,          // 5%
    memoryUsage: 0.9,         // 90%
  },

  // Reporting
  reporting: {
    interval: 3600000, // 1 hour
    format: 'json',
    destination: 'logs/monitoring.log',
  },
};
```

## Deployment Configuration

### Docker Configuration

```dockerfile
# Dockerfile.pdf-generator
FROM node:18-alpine

# Install Puppeteer dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/pdfs && chmod 755 uploads/pdfs

# Set user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  pdf-generator:
    build:
      context: .
      dockerfile: Dockerfile.pdf-generator
    environment:
      - NODE_ENV=production
      - PDF_UPLOAD_DIR=/app/uploads/pdfs
      - PDF_MAX_STORAGE_SIZE=1073741824
      - PDF_RETENTION_HOURS=24
      - PUPPETEER_HEADLESS=true
      - PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
    volumes:
      - pdf_storage:/app/uploads/pdfs
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  pdf_storage:
    driver: local
```

### Kubernetes Configuration

```yaml
# k8s-pdf-generator.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pdf-generator
spec:
  replicas: 2
  selector:
    matchLabels:
      app: pdf-generator
  template:
    metadata:
      labels:
        app: pdf-generator
    spec:
      containers:
      - name: pdf-generator
        image: alacraft/pdf-generator:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PDF_UPLOAD_DIR
          value: "/app/uploads/pdfs"
        - name: PUPPETEER_HEADLESS
          value: "true"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        volumeMounts:
        - name: pdf-storage
          mountPath: /app/uploads/pdfs
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: pdf-storage
        persistentVolumeClaim:
          claimName: pdf-storage-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pdf-storage-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

## Security Configuration

### File Security

```typescript
// security.config.ts
export const securityConfig = {
  // File upload restrictions
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf'],
    scanForMalware: false, // Enable if malware scanning available
  },

  // Path validation
  pathValidation: {
    allowedDirectories: ['uploads/pdfs'],
    blockTraversal: true,
    maxPathLength: 255,
  },

  // File permissions
  permissions: {
    fileMode: 0o644,
    dirMode: 0o755,
    owner: 'app',
    group: 'app',
  },

  // Rate limiting
  rateLimiting: {
    enabled: true,
    windowMs: 3600000, // 1 hour
    maxRequests: 10,   // per IP
    skipSuccessfulRequests: false,
  },
};
```

### Data Protection

```typescript
// data-protection.config.ts
export const dataProtectionConfig = {
  // PII handling
  pii: {
    maskInLogs: true,
    encryptAtRest: false, // Enable if encryption required
    retentionDays: 30,
  },

  // Audit trail
  audit: {
    logAllAccess: true,
    includeUserAgent: true,
    includeIPAddress: true,
    retentionDays: 90,
  },

  // Data sanitization
  sanitization: {
    removeMetadata: true,
    sanitizeFilenames: true,
    validateContent: true,
  },
};
```

## Testing Configuration

### Test Environment

```typescript
// test.config.ts
export const testConfig = {
  // Test data
  mockData: {
    generateRandomOrders: true,
    includeEdgeCases: true,
    testAllLocales: true,
  },

  // Test settings
  settings: {
    timeout: 60000, // 1 minute for PDF generation tests
    retries: 2,
    parallel: false, // Run PDF tests sequentially
  },

  // Mock services
  mocks: {
    puppeteer: false, // Use real Puppeteer in tests
    emailService: true,
    storageService: false,
  },
};
```

This configuration guide provides comprehensive coverage of all configurable aspects of the PDF generation system, from basic settings to advanced deployment and security configurations.