# swaks Email System Troubleshooting Guide

## Overview

This guide covers common issues, solutions, and optimization techniques for the swaks-based email attachment system. swaks (Swiss Army Knife SMTP) is a command-line SMTP client that provides reliable email delivery with attachment support.

## Common swaks Issues and Solutions

### 1. swaks Installation Issues

#### Symptoms
- Command not found: swaks
- Permission denied errors
- Missing dependencies

#### Solutions

**Ubuntu/Debian Installation:**
```bash
# Update package list
sudo apt-get update

# Install swaks
sudo apt-get install swaks

# Verify installation
swaks --version
which swaks
```

**CentOS/RHEL Installation:**
```bash
# Enable EPEL repository if needed
sudo yum install epel-release

# Install swaks
sudo yum install swaks
# or for newer versions
sudo dnf install swaks

# Verify installation
swaks --version
```

**macOS Installation:**
```bash
# Using Homebrew
brew install swaks

# Using MacPorts
sudo port install swaks

# Verify installation
swaks --version
```

**Manual Installation:**
```bash
# Download and install manually
wget https://jetmore.org/john/code/swaks/files/swaks-20201014.0.tar.gz
tar -xzf swaks-20201014.0.tar.gz
cd swaks-20201014.0
sudo cp swaks /usr/local/bin/
sudo chmod +x /usr/local/bin/swaks
```

### 2. SMTP Authentication Failures

#### Symptoms
- Authentication failed errors
- Login incorrect messages
- Connection refused errors

#### Common Error Messages
```
*** Authentication failed: 535 5.7.8 Username and Password not accepted
*** Connection refused by smtp.gmail.com:587
*** TLS negotiation failed
```

#### Solutions

**Gmail Configuration:**
```bash
# For Gmail, use app passwords instead of regular passwords
# 1. Enable 2-factor authentication
# 2. Generate app password
# 3. Use app password in swaks command

# Test Gmail connection
swaks --to test@example.com \
      --server smtp.gmail.com \
      --port 587 \
      --tls \
      --auth-user your-email@gmail.com \
      --auth-password your-app-password \
      --h-Subject "Test Email" \
      --body "Test message"
```

**Office 365/Outlook Configuration:**
```bash
# For Office 365
swaks --to test@example.com \
      --server smtp-mail.outlook.com \
      --port 587 \
      --tls \
      --auth-user your-email@outlook.com \
      --auth-password your-password \
      --h-Subject "Test Email" \
      --body "Test message"
```

**Custom SMTP Server:**
```bash
# For custom SMTP servers
swaks --to test@example.com \
      --server your-smtp-server.com \
      --port 587 \
      --tls \
      --auth-user your-username \
      --auth-password your-password \
      --h-Subject "Test Email" \
      --body "Test message"
```

**Environment Variable Configuration:**
```bash
# Set environment variables for security
export SMTP_SERVER="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@gmail.com"
export SMTP_PASS="your-app-password"

# Use in swaks command
swaks --to test@example.com \
      --server "$SMTP_SERVER" \
      --port "$SMTP_PORT" \
      --tls \
      --auth-user "$SMTP_USER" \
      --auth-password "$SMTP_PASS" \
      --h-Subject "Test Email" \
      --body "Test message"
```

### 3. TLS/SSL Connection Issues

#### Symptoms
- TLS negotiation failed
- SSL handshake errors
- Certificate verification failures

#### Solutions

**Force TLS Version:**
```bash
# Force specific TLS version
swaks --to test@example.com \
      --server smtp.gmail.com \
      --port 587 \
      --tls \
      --tls-protocol tlsv1_2 \
      --auth-user your-email@gmail.com \
      --auth-password your-app-password
```

**Disable Certificate Verification (for testing only):**
```bash
# WARNING: Only use for testing/debugging
swaks --to test@example.com \
      --server smtp.example.com \
      --port 587 \
      --tls \
      --tls-verify 0 \
      --auth-user your-email@example.com \
      --auth-password your-password
```

**Use SSL Instead of TLS:**
```bash
# For servers that require SSL on port 465
swaks --to test@example.com \
      --server smtp.gmail.com \
      --port 465 \
      --tls-on-connect \
      --auth-user your-email@gmail.com \
      --auth-password your-app-password
```

### 4. Attachment Issues

#### Symptoms
- Attachments not appearing in emails
- Corrupted attachment files
- Email size limit exceeded errors

#### Solutions

**Basic Attachment Syntax:**
```bash
# Correct attachment syntax
swaks --to test@example.com \
      --server smtp.gmail.com \
      --port 587 \
      --tls \
      --auth-user your-email@gmail.com \
      --auth-password your-app-password \
      --h-Subject "Test with Attachment" \
      --attach /path/to/file.pdf \
      --attach-type application/pdf \
      --attach-name "document.pdf" \
      --body "Please find attached document."
```

**Multiple Attachments:**
```bash
# Multiple attachments
swaks --to test@example.com \
      --server smtp.gmail.com \
      --port 587 \
      --tls \
      --auth-user your-email@gmail.com \
      --auth-password your-app-password \
      --h-Subject "Multiple Attachments" \
      --attach /path/to/file1.pdf \
      --attach-type application/pdf \
      --attach-name "document1.pdf" \
      --attach /path/to/file2.jpg \
      --attach-type image/jpeg \
      --attach-name "image1.jpg" \
      --body "Multiple files attached."
```

**Attachment Size Validation:**
```bash
# Check file size before attaching
file_size=$(stat -f%z /path/to/file.pdf 2>/dev/null || stat -c%s /path/to/file.pdf)
max_size=$((25 * 1024 * 1024))  # 25MB

if [ "$file_size" -gt "$max_size" ]; then
    echo "File too large: $file_size bytes (max: $max_size)"
    exit 1
fi
```

**MIME Type Detection:**
```bash
# Detect MIME type automatically
mime_type=$(file --mime-type -b /path/to/file.pdf)
echo "Detected MIME type: $mime_type"

swaks --to test@example.com \
      --attach /path/to/file.pdf \
      --attach-type "$mime_type" \
      --attach-name "document.pdf"
```

### 5. HTML Content Issues

#### Symptoms
- Malformed email content
- Special characters causing errors
- HTML not rendering properly

#### Solutions

**Proper HTML Escaping:**
```bash
# Escape special characters in HTML
html_content='<html><body><h1>Order Confirmation</h1><p>Thank you for your order!</p></body></html>'

# Escape quotes and special characters
escaped_html=$(echo "$html_content" | sed 's/"/\\"/g' | sed "s/'/\\'/g")

swaks --to test@example.com \
      --body "$escaped_html" \
      --add-header "Content-Type: text/html; charset=UTF-8" \
      --add-header "MIME-Version: 1.0"
```

**Using External HTML File:**
```bash
# Read HTML from file
swaks --to test@example.com \
      --data /path/to/email.html \
      --add-header "Content-Type: text/html; charset=UTF-8"
```

**Simplified HTML Template:**
```html
<!-- email-template.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Order Confirmation</h1>
        <p>Dear Customer,</p>
        <p>Your order details are attached as a PDF document.</p>
        <p>Thank you for your business!</p>
    </div>
</body>
</html>
```

### 6. Character Encoding Issues

#### Symptoms
- Special characters not displaying correctly
- Encoding errors in subject lines
- Non-ASCII characters corrupted

#### Solutions

**UTF-8 Encoding:**
```bash
# Ensure UTF-8 encoding
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

swaks --to test@example.com \
      --h-Subject "Test with UTF-8: café résumé" \
      --body "Content with special characters: café, résumé, naïve" \
      --add-header "Content-Type: text/html; charset=UTF-8"
```

**Base64 Encoding for Subject:**
```bash
# For complex subjects, use base64 encoding
subject_b64=$(echo -n "Xác nhận đơn hàng #12345" | base64)

swaks --to test@example.com \
      --h-Subject "=?UTF-8?B?${subject_b64}?=" \
      --body "Vietnamese content test"
```

## Performance Optimization

### 1. Connection Reuse

```bash
# Use connection pooling for multiple emails
# Create a script that reuses connections
#!/bin/bash

SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Function to send email with reused connection
send_email() {
    local to="$1"
    local subject="$2"
    local body="$3"
    local attachment="$4"

    swaks --to "$to" \
          --server "$SMTP_SERVER" \
          --port "$SMTP_PORT" \
          --tls \
          --auth-user "$SMTP_USER" \
          --auth-password "$SMTP_PASS" \
          --h-Subject "$subject" \
          --body "$body" \
          ${attachment:+--attach "$attachment"} \
          --quit-after QUIT
}

# Send multiple emails
send_email "customer1@example.com" "Order #1" "Your order is ready" "/path/to/order1.pdf"
send_email "customer2@example.com" "Order #2" "Your order is ready" "/path/to/order2.pdf"
```

### 2. Parallel Processing

```bash
# Send emails in parallel (be careful with rate limits)
#!/bin/bash

send_email_background() {
    local to="$1"
    local subject="$2"
    local attachment="$3"

    swaks --to "$to" \
          --server smtp.gmail.com \
          --port 587 \
          --tls \
          --auth-user "$SMTP_USER" \
          --auth-password "$SMTP_PASS" \
          --h-Subject "$subject" \
          --attach "$attachment" \
          --body "Your order details are attached." &
}

# Send multiple emails in background
send_email_background "customer1@example.com" "Order #1" "/path/to/order1.pdf"
send_email_background "customer2@example.com" "Order #2" "/path/to/order2.pdf"
send_email_background "customer3@example.com" "Order #3" "/path/to/order3.pdf"

# Wait for all background jobs to complete
wait
echo "All emails sent"
```

### 3. Rate Limiting

```bash
# Implement rate limiting to avoid SMTP server limits
#!/bin/bash

RATE_LIMIT=10  # emails per minute
DELAY=$((60 / RATE_LIMIT))  # seconds between emails

send_with_rate_limit() {
    local to="$1"
    local subject="$2"
    local attachment="$3"

    echo "Sending email to $to..."
    swaks --to "$to" \
          --server smtp.gmail.com \
          --port 587 \
          --tls \
          --auth-user "$SMTP_USER" \
          --auth-password "$SMTP_PASS" \
          --h-Subject "$subject" \
          --attach "$attachment" \
          --body "Your order details are attached."

    echo "Waiting $DELAY seconds..."
    sleep $DELAY
}

# Send emails with rate limiting
while IFS=',' read -r email subject attachment; do
    send_with_rate_limit "$email" "$subject" "$attachment"
done < email_list.csv
```

## Debugging and Diagnostics

### 1. Verbose Output

```bash
# Enable verbose output for debugging
swaks --to test@example.com \
      --server smtp.gmail.com \
      --port 587 \
      --tls \
      --auth-user your-email@gmail.com \
      --auth-password your-app-password \
      --h-Subject "Debug Test" \
      --body "Debug message" \
      --show-raw-text \
      --show-time-lapse
```

### 2. Connection Testing

```bash
# Test SMTP connection without sending email
swaks --to test@example.com \
      --server smtp.gmail.com \
      --port 587 \
      --tls \
      --auth-user your-email@gmail.com \
      --auth-password your-app-password \
      --quit-after RCPT
```

### 3. Protocol Debugging

```bash
# Show SMTP protocol conversation
swaks --to test@example.com \
      --server smtp.gmail.com \
      --port 587 \
      --tls \
      --auth-user your-email@gmail.com \
      --auth-password your-app-password \
      --show-raw-text \
      --pipe
```

### 4. Log Analysis

```bash
# Create detailed logs
swaks --to test@example.com \
      --server smtp.gmail.com \
      --port 587 \
      --tls \
      --auth-user your-email@gmail.com \
      --auth-password your-app-password \
      --h-Subject "Logged Test" \
      --body "Test with logging" \
      --show-time-lapse 2>&1 | tee swaks.log

# Analyze logs for errors
grep -i "error\|fail\|denied" swaks.log
grep -i "tls\|ssl" swaks.log
grep -i "auth" swaks.log
```

## Error Code Reference

### Common swaks Exit Codes

| Exit Code | Meaning | Solution |
|-----------|---------|----------|
| 0 | Success | No action needed |
| 1 | Generic error | Check command syntax and parameters |
| 2 | Connection failed | Verify server, port, and network connectivity |
| 3 | Authentication failed | Check username, password, and auth method |
| 4 | TLS/SSL error | Verify TLS settings and certificates |
| 5 | SMTP protocol error | Check server compatibility and settings |
| 6 | File not found | Verify attachment file paths |
| 7 | Permission denied | Check file permissions and user access |

### SMTP Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 220 | Service ready | Continue with connection |
| 250 | Requested action completed | Success |
| 354 | Start mail input | Begin sending message data |
| 421 | Service not available | Retry later |
| 450 | Mailbox unavailable | Retry later |
| 451 | Local error | Check server configuration |
| 452 | Insufficient storage | Reduce message size |
| 500 | Syntax error | Check command format |
| 501 | Parameter syntax error | Verify parameters |
| 502 | Command not implemented | Use different approach |
| 503 | Bad sequence | Check command order |
| 504 | Parameter not implemented | Use supported parameters |
| 535 | Authentication failed | Check credentials |
| 550 | Mailbox unavailable | Verify recipient address |
| 551 | User not local | Check recipient domain |
| 552 | Storage allocation exceeded | Reduce message size |
| 553 | Mailbox name invalid | Verify recipient format |
| 554 | Transaction failed | General failure |

## Monitoring and Alerting

### 1. Health Check Script

```bash
#!/bin/bash
# swaks-health-check.sh

SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
TEST_EMAIL="test@example.com"

# Test basic connectivity
echo "Testing SMTP connectivity..."
if swaks --to "$TEST_EMAIL" \
         --server "$SMTP_SERVER" \
         --port "$SMTP_PORT" \
         --tls \
         --auth-user "$SMTP_USER" \
         --auth-password "$SMTP_PASS" \
         --quit-after RCPT \
         --hide-all > /dev/null 2>&1; then
    echo "✓ SMTP connection successful"
    exit 0
else
    echo "✗ SMTP connection failed"
    exit 1
fi
```

### 2. Performance Monitoring

```bash
#!/bin/bash
# swaks-performance-monitor.sh

LOG_FILE="/var/log/swaks-performance.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Measure email send time
start_time=$(date +%s.%N)

swaks --to test@example.com \
      --server smtp.gmail.com \
      --port 587 \
      --tls \
      --auth-user "$SMTP_USER" \
      --auth-password "$SMTP_PASS" \
      --h-Subject "Performance Test" \
      --body "Performance monitoring test" \
      --hide-all

end_time=$(date +%s.%N)
duration=$(echo "$end_time - $start_time" | bc)

echo "$TIMESTAMP,Email Send,$duration seconds" >> "$LOG_FILE"

# Alert if performance degrades
if (( $(echo "$duration > 30" | bc -l) )); then
    echo "ALERT: Email send took $duration seconds (threshold: 30s)"
fi
```

### 3. Error Tracking

```bash
#!/bin/bash
# swaks-error-tracker.sh

ERROR_LOG="/var/log/swaks-errors.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Function to log errors
log_error() {
    local error_type="$1"
    local error_message="$2"
    echo "$TIMESTAMP,$error_type,$error_message" >> "$ERROR_LOG"
}

# Send email with error tracking
if ! swaks --to test@example.com \
           --server smtp.gmail.com \
           --port 587 \
           --tls \
           --auth-user "$SMTP_USER" \
           --auth-password "$SMTP_PASS" \
           --h-Subject "Test Email" \
           --body "Test message" 2>&1; then

    case $? in
        2) log_error "CONNECTION" "Failed to connect to SMTP server" ;;
        3) log_error "AUTHENTICATION" "SMTP authentication failed" ;;
        4) log_error "TLS" "TLS/SSL connection failed" ;;
        *) log_error "UNKNOWN" "Unknown error occurred" ;;
    esac
fi
```

## Best Practices

### 1. Security

- Use app passwords instead of regular passwords for Gmail
- Store credentials in environment variables, not in scripts
- Use TLS encryption for all connections
- Regularly rotate SMTP passwords
- Monitor for unauthorized access attempts

### 2. Reliability

- Implement retry logic with exponential backoff
- Use connection pooling for multiple emails
- Validate email addresses before sending
- Check attachment file sizes and types
- Monitor delivery rates and error patterns

### 3. Performance

- Respect SMTP server rate limits
- Use parallel processing carefully
- Optimize HTML content for email clients
- Compress large attachments when possible
- Cache SMTP connections when sending multiple emails

### 4. Compliance

- Include proper unsubscribe mechanisms
- Respect recipient preferences
- Follow CAN-SPAM and GDPR requirements
- Log email activities for audit purposes
- Implement proper data retention policies

This troubleshooting guide provides comprehensive coverage of swaks-related issues and their solutions, helping maintain a reliable email delivery system.