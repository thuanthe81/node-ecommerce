# PDF Generation System Deployment Guide

## Overview

This guide covers the complete deployment process for the PDF generation and email attachment system, including infrastructure setup, configuration, monitoring, and maintenance procedures.

## Prerequisites

### System Requirements

**Minimum Requirements:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB available space
- Network: Stable internet connection for SMTP

**Recommended Requirements:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 50GB+ available space
- Network: High-speed connection with low latency

### Software Dependencies

**Core Dependencies:**
```bash
# Node.js (version 18 or higher)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**System Dependencies:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
  chromium-browser \
  swaks \
  curl \
  wget \
  git \
  build-essential \
  python3 \
  python3-pip

# CentOS/RHEL
sudo yum update
sudo yum install -y \
  chromium \
  swaks \
  curl \
  wget \
  git \
  gcc-c++ \
  make \
  python3 \
  python3-pip
```

**Puppeteer Dependencies:**
```bash
# Ubuntu/Debian - Install Chrome dependencies
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

## Environment Setup

### 1. Application Configuration

Create environment configuration file:

```bash
# .env.production
NODE_ENV=production

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# PDF Generation Settings
PDF_UPLOAD_DIR=uploads/pdfs
PDF_MAX_STORAGE_SIZE=1073741824
PDF_RETENTION_HOURS=24
PDF_CLEANUP_INTERVAL=3600000
PDF_MAX_FILE_SIZE=10485760

# Puppeteer Configuration
PUPPETEER_HEADLESS=true
PUPPETEER_TIMEOUT=30000
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_ARGS="--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage"

# SMTP Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-app-password

# Email Settings
EMAIL_ATTACHMENT_MAX_SIZE=25165824
EMAIL_RESEND_RATE_LIMIT=3
EMAIL_RESEND_WINDOW_HOURS=1

# Monitoring and Logging
PDF_AUDIT_ENABLED=true
PDF_PERFORMANCE_MONITORING=true
PDF_DEBUG_MODE=false
LOG_LEVEL=info

# Security Settings
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=https://your-domain.com
```

### 2. Directory Structure Setup

```bash
# Create application directory
sudo mkdir -p /opt/alacraft-backend
cd /opt/alacraft-backend

# Create necessary directories
mkdir -p uploads/pdfs
mkdir -p logs
mkdir -p backups
mkdir -p config

# Set proper permissions
sudo chown -R app:app /opt/alacraft-backend
chmod 755 uploads/pdfs
chmod 755 logs
chmod 755 backups
```

### 3. User and Permissions Setup

```bash
# Create application user
sudo useradd -r -s /bin/false app

# Set ownership
sudo chown -R app:app /opt/alacraft-backend

# Set file permissions
find /opt/alacraft-backend -type f -exec chmod 644 {} \;
find /opt/alacraft-backend -type d -exec chmod 755 {} \;

# Make scripts executable
chmod +x /opt/alacraft-backend/scripts/*.sh
```

## Deployment Methods

### Method 1: Direct Deployment

#### 1. Clone and Build

```bash
# Clone repository
git clone https://github.com/your-org/alacraft-backend.git /opt/alacraft-backend
cd /opt/alacraft-backend

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Copy environment file
cp .env.example .env.production
# Edit .env.production with your configuration
```

#### 2. Database Setup

```bash
# Run database migrations
npm run prisma:migrate:deploy

# Seed database (if needed)
npm run prisma:db:seed
```

#### 3. Start Application

```bash
# Start with PM2 (recommended)
npm install -g pm2
pm2 start ecosystem.config.js --env production

# Or start directly
npm run start:prod
```

### Method 2: Docker Deployment

#### 1. Docker Setup

```dockerfile
# Dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    swaks \
    curl

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads/pdfs && chmod 755 uploads/pdfs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "run", "start:prod"]
```

#### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/alacraft
      - PDF_UPLOAD_DIR=/app/uploads/pdfs
      - PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
    volumes:
      - pdf_storage:/app/uploads/pdfs
      - app_logs:/app/logs
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=alacraft
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  pdf_storage:
  app_logs:
```

#### 3. Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app

# Run database migrations
docker-compose exec app npm run prisma:migrate:deploy
```

### Method 3: Kubernetes Deployment

#### 1. Kubernetes Manifests

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: alacraft

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: alacraft
data:
  NODE_ENV: "production"
  PDF_UPLOAD_DIR: "/app/uploads/pdfs"
  PUPPETEER_HEADLESS: "true"
  PUPPETEER_EXECUTABLE_PATH: "/usr/bin/chromium-browser"
  PDF_AUDIT_ENABLED: "true"
  PDF_PERFORMANCE_MONITORING: "true"

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: alacraft
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  SMTP_USER: <base64-encoded-smtp-user>
  SMTP_PASSWORD: <base64-encoded-smtp-password>
  JWT_SECRET: <base64-encoded-jwt-secret>

---
# k8s/pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pdf-storage-pvc
  namespace: alacraft
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi

---
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: alacraft-backend
  namespace: alacraft
spec:
  replicas: 2
  selector:
    matchLabels:
      app: alacraft-backend
  template:
    metadata:
      labels:
        app: alacraft-backend
    spec:
      containers:
      - name: app
        image: alacraft/backend:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
        volumeMounts:
        - name: pdf-storage
          mountPath: /app/uploads/pdfs
        - name: logs
          mountPath: /app/logs
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
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
      - name: logs
        emptyDir: {}

---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: alacraft-backend-service
  namespace: alacraft
spec:
  selector:
    app: alacraft-backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: alacraft-backend-ingress
  namespace: alacraft
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.alacraft.com
    secretName: alacraft-tls
  rules:
  - host: api.alacraft.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: alacraft-backend-service
            port:
              number: 80
```

#### 2. Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n alacraft
kubectl get services -n alacraft
kubectl get ingress -n alacraft

# View logs
kubectl logs -f deployment/alacraft-backend -n alacraft

# Run database migrations
kubectl exec -it deployment/alacraft-backend -n alacraft -- npm run prisma:migrate:deploy
```

## Load Balancer and Reverse Proxy Setup

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/alacraft-backend
upstream alacraft_backend {
    server 127.0.0.1:3000;
    # Add more servers for load balancing
    # server 127.0.0.1:3001;
    # server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name api.alacraft.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.alacraft.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.alacraft.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.alacraft.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Client Max Body Size (for file uploads)
    client_max_body_size 50M;

    # Proxy Configuration
    location / {
        proxy_pass http://alacraft_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health Check Endpoint
    location /health {
        proxy_pass http://alacraft_backend/health;
        access_log off;
    }

    # Static Files (if serving directly)
    location /uploads/ {
        alias /opt/alacraft-backend/uploads/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Logging
    access_log /var/log/nginx/alacraft-backend.access.log;
    error_log /var/log/nginx/alacraft-backend.error.log;
}
```

### Enable Nginx Configuration

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/alacraft-backend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Enable auto-start
sudo systemctl enable nginx
```

## SSL Certificate Setup

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.alacraft.com

# Test auto-renewal
sudo certbot renew --dry-run

# Set up auto-renewal cron job
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Using Custom SSL Certificate

```bash
# Copy certificate files
sudo cp your-certificate.crt /etc/ssl/certs/alacraft.crt
sudo cp your-private-key.key /etc/ssl/private/alacraft.key

# Set proper permissions
sudo chmod 644 /etc/ssl/certs/alacraft.crt
sudo chmod 600 /etc/ssl/private/alacraft.key

# Update Nginx configuration to use custom certificates
# ssl_certificate /etc/ssl/certs/alacraft.crt;
# ssl_certificate_key /etc/ssl/private/alacraft.key;
```

## Process Management

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'alacraft-backend',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Restart settings
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',

    // Logging
    log_file: 'logs/combined.log',
    out_file: 'logs/out.log',
    error_file: 'logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Monitoring
    monitoring: false,

    // Advanced settings
    kill_timeout: 5000,
    listen_timeout: 3000,

    // Environment variables
    env_file: '.env.production'
  }]
};
```

### PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Monitor processes
pm2 monit

# View logs
pm2 logs alacraft-backend

# Restart application
pm2 restart alacraft-backend

# Stop application
pm2 stop alacraft-backend

# Delete application
pm2 delete alacraft-backend

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u app --hp /home/app
```

## Database Setup and Migration

### PostgreSQL Setup

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE alacraft;
CREATE USER alacraft_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE alacraft TO alacraft_user;
\q

# Configure PostgreSQL
sudo nano /etc/postgresql/13/main/postgresql.conf
# Uncomment and modify:
# listen_addresses = 'localhost'
# max_connections = 100

sudo nano /etc/postgresql/13/main/pg_hba.conf
# Add line:
# local   alacraft        alacraft_user                   md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Database Migration

```bash
# Run migrations
npm run prisma:migrate:deploy

# Generate Prisma client
npm run prisma:generate

# Seed database (if needed)
npm run prisma:db:seed

# Backup database
pg_dump -U alacraft_user -h localhost alacraft > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Monitoring and Logging

### Application Monitoring

```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### System Monitoring

```bash
# Install system monitoring tools
sudo apt-get install htop iotop nethogs

# Monitor system resources
htop
iotop
nethogs

# Check disk usage
df -h
du -sh /opt/alacraft-backend/uploads/pdfs

# Monitor network connections
netstat -tulpn | grep :3000
```

### Log Management

```bash
# Configure logrotate for application logs
sudo nano /etc/logrotate.d/alacraft-backend

/opt/alacraft-backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 app app
    postrotate
        pm2 reloadLogs
    endscript
}

# Test logrotate configuration
sudo logrotate -d /etc/logrotate.d/alacraft-backend
```

## Security Configuration

### Firewall Setup

```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow application port (if needed)
sudo ufw allow 3000

# Check status
sudo ufw status
```

### Security Hardening

```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# Install fail2ban
sudo apt-get install fail2ban

# Configure fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Add custom jail for application
sudo nano /etc/fail2ban/jail.d/alacraft.conf
```

```ini
# /etc/fail2ban/jail.d/alacraft.conf
[alacraft-backend]
enabled = true
port = 3000
filter = alacraft-backend
logpath = /opt/alacraft-backend/logs/error.log
maxretry = 5
bantime = 3600
findtime = 600
```

### Environment Security

```bash
# Secure environment file
chmod 600 .env.production
chown app:app .env.production

# Set up proper file permissions
find /opt/alacraft-backend -type f -exec chmod 644 {} \;
find /opt/alacraft-backend -type d -exec chmod 755 {} \;
chmod 600 /opt/alacraft-backend/.env.production
chmod +x /opt/alacraft-backend/scripts/*.sh
```

## Backup and Recovery

### Automated Backup Script

```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/backup.sh

BACKUP_DIR="/opt/backups/alacraft"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/alacraft-backend"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
echo "Backing up database..."
pg_dump -U alacraft_user -h localhost alacraft > "$BACKUP_DIR/database_$DATE.sql"

# Application files backup
echo "Backing up application files..."
tar -czf "$BACKUP_DIR/app_files_$DATE.tar.gz" \
    --exclude="$APP_DIR/node_modules" \
    --exclude="$APP_DIR/dist" \
    --exclude="$APP_DIR/logs" \
    --exclude="$APP_DIR/uploads/pdfs" \
    "$APP_DIR"

# PDF files backup (if needed)
echo "Backing up PDF files..."
tar -czf "$BACKUP_DIR/pdf_files_$DATE.tar.gz" "$APP_DIR/uploads/pdfs"

# Configuration backup
echo "Backing up configuration..."
cp "$APP_DIR/.env.production" "$BACKUP_DIR/env_$DATE"
cp /etc/nginx/sites-available/alacraft-backend "$BACKUP_DIR/nginx_$DATE.conf"

# Cleanup old backups (keep 7 days)
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "env_*" -mtime +7 -delete
find "$BACKUP_DIR" -name "nginx_*.conf" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### Schedule Backups

```bash
# Make backup script executable
chmod +x /opt/alacraft-backend/scripts/backup.sh

# Add to crontab
crontab -e
# Add line for daily backup at 2 AM
0 2 * * * /opt/alacraft-backend/scripts/backup.sh >> /var/log/alacraft-backup.log 2>&1
```

### Recovery Procedures

```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/restore.sh

BACKUP_DIR="/opt/backups/alacraft"
RESTORE_DATE="$1"

if [ -z "$RESTORE_DATE" ]; then
    echo "Usage: $0 <backup_date>"
    echo "Available backups:"
    ls -la "$BACKUP_DIR" | grep database_
    exit 1
fi

# Stop application
pm2 stop alacraft-backend

# Restore database
echo "Restoring database..."
dropdb -U alacraft_user alacraft
createdb -U alacraft_user alacraft
psql -U alacraft_user -d alacraft < "$BACKUP_DIR/database_$RESTORE_DATE.sql"

# Restore application files
echo "Restoring application files..."
tar -xzf "$BACKUP_DIR/app_files_$RESTORE_DATE.tar.gz" -C /

# Restore configuration
echo "Restoring configuration..."
cp "$BACKUP_DIR/env_$RESTORE_DATE" /opt/alacraft-backend/.env.production
cp "$BACKUP_DIR/nginx_$RESTORE_DATE.conf" /etc/nginx/sites-available/alacraft-backend

# Restart services
nginx -t && systemctl reload nginx
pm2 start alacraft-backend

echo "Restore completed for date: $RESTORE_DATE"
```

## Health Checks and Monitoring

### Health Check Endpoint

The application provides a comprehensive health check endpoint at `/health`:

```typescript
// Health check response example
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 15
    },
    "puppeteer": {
      "status": "healthy",
      "message": "Browser launch successful"
    },
    "storage": {
      "status": "healthy",
      "availableSpace": "45GB",
      "utilizationPercentage": 25
    },
    "email": {
      "status": "healthy",
      "smtpConnection": "successful"
    }
  }
}
```

### Monitoring Script

```bash
#!/bin/bash
# /opt/alacraft-backend/scripts/monitor.sh

HEALTH_URL="http://localhost:3000/health"
LOG_FILE="/var/log/alacraft-monitor.log"
ALERT_EMAIL="admin@alacraft.com"

# Check health endpoint
response=$(curl -s -w "%{http_code}" "$HEALTH_URL")
http_code="${response: -3}"
body="${response%???}"

timestamp=$(date '+%Y-%m-%d %H:%M:%S')

if [ "$http_code" -eq 200 ]; then
    echo "$timestamp - Health check passed" >> "$LOG_FILE"
else
    echo "$timestamp - Health check failed (HTTP $http_code)" >> "$LOG_FILE"

    # Send alert email
    echo "Health check failed at $timestamp. HTTP Code: $http_code" | \
    mail -s "AlaCraft Backend Health Alert" "$ALERT_EMAIL"

    # Attempt restart if critical
    if [ "$http_code" -eq 000 ] || [ "$http_code" -eq 500 ]; then
        echo "$timestamp - Attempting restart" >> "$LOG_FILE"
        pm2 restart alacraft-backend
    fi
fi
```

### Schedule Monitoring

```bash
# Add to crontab for monitoring every 5 minutes
crontab -e
*/5 * * * * /opt/alacraft-backend/scripts/monitor.sh
```

This deployment guide provides comprehensive coverage of all aspects needed to successfully deploy and maintain the PDF generation system in production environments.