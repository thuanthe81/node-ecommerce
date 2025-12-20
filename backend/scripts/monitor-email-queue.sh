#!/bin/bash

# Email Queue Monitoring Script
# This script monitors the health of email queue workers and provides alerts

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/../logs"
LOG_FILE="${LOG_DIR}/email-queue-monitoring.log"
ALERT_LOG="${LOG_DIR}/email-queue-alerts.log"
METRICS_LOG="${LOG_DIR}/email-queue-metrics.log"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration from environment
REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}
API_HOST=${API_HOST:-localhost}
API_PORT=${API_PORT:-3000}
ALERT_THRESHOLD_QUEUE_DEPTH=${ALERT_THRESHOLD_QUEUE_DEPTH:-1000}
ALERT_THRESHOLD_ERROR_RATE=${ALERT_THRESHOLD_ERROR_RATE:-5}
ALERT_THRESHOLD_PROCESSING_TIME=${ALERT_THRESHOLD_PROCESSING_TIME:-300}

# Timestamp for logging
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Function to log messages
log_message() {
    local level=$1
    local message=$2
    echo "[$TIMESTAMP] [$level] $message" | tee -a "$LOG_FILE"
}

# Function to log alerts
log_alert() {
    local message=$1
    echo "[$TIMESTAMP] ALERT: $message" | tee -a "$ALERT_LOG"
    log_message "ALERT" "$message"
}

# Function to log metrics
log_metrics() {
    local metrics=$1
    echo "[$TIMESTAMP] $metrics" >> "$METRICS_LOG"
}

# Function to check PM2 processes
check_pm2_processes() {
    log_message "INFO" "Checking PM2 processes..."

    if ! command -v pm2 &> /dev/null; then
        log_alert "PM2 not found - email queue workers cannot be monitored"
        return 1
    fi

    # Get PM2 process list
    local pm2_output
    if ! pm2_output=$(pm2 jlist 2>/dev/null); then
        log_alert "Failed to get PM2 process list"
        return 1
    fi

    # Check for email queue workers
    local worker_count
    worker_count=$(echo "$pm2_output" | jq -r '.[] | select(.name=="email-queue-worker") | .pm2_env.status' 2>/dev/null | wc -l)

    if [ "$worker_count" -eq 0 ]; then
        log_alert "No email queue workers found"
        return 1
    fi

    # Check worker status
    local online_workers
    online_workers=$(echo "$pm2_output" | jq -r '.[] | select(.name=="email-queue-worker" and .pm2_env.status=="online") | .name' 2>/dev/null | wc -l)

    if [ "$online_workers" -eq 0 ]; then
        log_alert "No email queue workers are online - attempting restart"
        pm2 restart email-queue-worker
        log_message "INFO" "Restarted email queue workers"
        return 1
    elif [ "$online_workers" -lt "$worker_count" ]; then
        log_alert "Some email queue workers are offline ($online_workers/$worker_count online)"
        pm2 restart email-queue-worker
        log_message "INFO" "Restarted email queue workers"
    else
        log_message "INFO" "All email queue workers are online ($online_workers/$worker_count)"
    fi

    # Check worker memory usage
    local high_memory_workers
    high_memory_workers=$(echo "$pm2_output" | jq -r '.[] | select(.name=="email-queue-worker" and .monit.memory > 500000000) | .name' 2>/dev/null | wc -l)

    if [ "$high_memory_workers" -gt 0 ]; then
        log_alert "$high_memory_workers email queue workers using high memory (>500MB)"
    fi

    return 0
}

# Function to check Redis connection
check_redis_connection() {
    log_message "INFO" "Checking Redis connection..."

    if ! command -v redis-cli &> /dev/null; then
        log_message "WARN" "redis-cli not found - skipping Redis check"
        return 0
    fi

    if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
        log_alert "Redis connection failed (${REDIS_HOST}:${REDIS_PORT})"
        return 1
    fi

    log_message "INFO" "Redis connection successful"

    # Check Redis memory usage
    local redis_memory
    redis_memory=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')

    if [ -n "$redis_memory" ]; then
        log_message "INFO" "Redis memory usage: $redis_memory"
        log_metrics "redis_memory=$redis_memory"
    fi

    return 0
}

# Function to check queue health via API
check_queue_health() {
    log_message "INFO" "Checking queue health via API..."

    if ! command -v curl &> /dev/null; then
        log_message "WARN" "curl not found - skipping API health check"
        return 0
    fi

    local health_url="http://${API_HOST}:${API_PORT}/email-queue/health"
    local http_code
    local response

    if ! response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$health_url" 2>/dev/null); then
        log_alert "Failed to connect to email queue health endpoint"
        return 1
    fi

    http_code=$(tail -n1 <<< "$response")

    if [ "$http_code" != "200" ]; then
        log_alert "Email queue health check returned HTTP $http_code"
        return 1
    fi

    log_message "INFO" "Email queue health check passed"

    # Parse health response if available
    if [ -f /tmp/health_response.json ]; then
        local queue_status
        queue_status=$(jq -r '.status' /tmp/health_response.json 2>/dev/null || echo "unknown")
        log_message "INFO" "Queue status: $queue_status"
        rm -f /tmp/health_response.json
    fi

    return 0
}

# Function to check queue metrics
check_queue_metrics() {
    log_message "INFO" "Checking queue metrics..."

    if ! command -v curl &> /dev/null; then
        log_message "WARN" "curl not found - skipping metrics check"
        return 0
    fi

    local metrics_url="http://${API_HOST}:${API_PORT}/email-queue/metrics"
    local response

    if ! response=$(curl -s "$metrics_url" 2>/dev/null); then
        log_message "WARN" "Failed to get queue metrics"
        return 0
    fi

    # Parse metrics
    local waiting_jobs
    local failed_jobs
    local completed_jobs
    local processing_rate

    waiting_jobs=$(echo "$response" | jq -r '.waiting // 0' 2>/dev/null || echo "0")
    failed_jobs=$(echo "$response" | jq -r '.failed // 0' 2>/dev/null || echo "0")
    completed_jobs=$(echo "$response" | jq -r '.completed // 0' 2>/dev/null || echo "0")
    processing_rate=$(echo "$response" | jq -r '.processingRate // 0' 2>/dev/null || echo "0")

    log_message "INFO" "Queue metrics - Waiting: $waiting_jobs, Failed: $failed_jobs, Completed: $completed_jobs"
    log_metrics "waiting_jobs=$waiting_jobs failed_jobs=$failed_jobs completed_jobs=$completed_jobs processing_rate=$processing_rate"

    # Check thresholds
    if [ "$waiting_jobs" -gt "$ALERT_THRESHOLD_QUEUE_DEPTH" ]; then
        log_alert "Queue depth too high: $waiting_jobs jobs waiting (threshold: $ALERT_THRESHOLD_QUEUE_DEPTH)"
    fi

    # Calculate error rate if we have enough data
    local total_jobs=$((failed_jobs + completed_jobs))
    if [ "$total_jobs" -gt 0 ]; then
        local error_rate
        error_rate=$(echo "scale=2; $failed_jobs * 100 / $total_jobs" | bc 2>/dev/null || echo "0")

        if [ "$(echo "$error_rate > $ALERT_THRESHOLD_ERROR_RATE" | bc 2>/dev/null)" = "1" ]; then
            log_alert "Error rate too high: ${error_rate}% (threshold: ${ALERT_THRESHOLD_ERROR_RATE}%)"
        fi

        log_metrics "error_rate=$error_rate"
    fi

    return 0
}

# Function to check system resources
check_system_resources() {
    log_message "INFO" "Checking system resources..."

    # Check disk space
    local disk_usage
    disk_usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$disk_usage" -gt 90 ]; then
        log_alert "Disk usage high: ${disk_usage}%"
    elif [ "$disk_usage" -gt 80 ]; then
        log_message "WARN" "Disk usage: ${disk_usage}%"
    else
        log_message "INFO" "Disk usage: ${disk_usage}%"
    fi

    log_metrics "disk_usage=${disk_usage}%"

    # Check memory usage
    if command -v free &> /dev/null; then
        local memory_usage
        memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')

        if [ "$memory_usage" -gt 90 ]; then
            log_alert "Memory usage high: ${memory_usage}%"
        elif [ "$memory_usage" -gt 80 ]; then
            log_message "WARN" "Memory usage: ${memory_usage}%"
        else
            log_message "INFO" "Memory usage: ${memory_usage}%"
        fi

        log_metrics "memory_usage=${memory_usage}%"
    fi

    # Check load average
    if [ -f /proc/loadavg ]; then
        local load_avg
        load_avg=$(cat /proc/loadavg | awk '{print $1}')
        log_message "INFO" "Load average: $load_avg"
        log_metrics "load_average=$load_avg"
    fi

    return 0
}

# Function to rotate logs
rotate_logs() {
    local max_size=10485760  # 10MB in bytes

    for log_file in "$LOG_FILE" "$ALERT_LOG" "$METRICS_LOG"; do
        if [ -f "$log_file" ] && [ $(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null || echo 0) -gt $max_size ]; then
            mv "$log_file" "${log_file}.old"
            touch "$log_file"
            log_message "INFO" "Rotated log file: $(basename "$log_file")"
        fi
    done
}

# Function to send notifications (placeholder)
send_notification() {
    local message=$1

    # This is a placeholder for notification logic
    # You could integrate with:
    # - Email notifications
    # - Slack webhooks
    # - PagerDuty
    # - SMS services

    log_message "INFO" "Notification: $message"

    # Example: Send to webhook (uncomment and configure as needed)
    # if [ -n "$WEBHOOK_URL" ]; then
    #     curl -X POST -H "Content-Type: application/json" \
    #          -d "{\"text\":\"$message\"}" \
    #          "$WEBHOOK_URL" 2>/dev/null || true
    # fi
}

# Function to generate summary report
generate_summary() {
    local exit_code=$1

    echo ""
    echo -e "${BLUE}=== Email Queue Monitoring Summary ===${NC}"
    echo "Timestamp: $TIMESTAMP"
    echo "Status: $([ $exit_code -eq 0 ] && echo -e "${GREEN}HEALTHY${NC}" || echo -e "${RED}ISSUES DETECTED${NC}")"
    echo ""

    if [ -f "$ALERT_LOG" ]; then
        local recent_alerts
        recent_alerts=$(tail -n 5 "$ALERT_LOG" | wc -l)
        if [ "$recent_alerts" -gt 0 ]; then
            echo -e "${YELLOW}Recent Alerts (last 5):${NC}"
            tail -n 5 "$ALERT_LOG"
            echo ""
        fi
    fi

    echo "Logs:"
    echo "  Main: $LOG_FILE"
    echo "  Alerts: $ALERT_LOG"
    echo "  Metrics: $METRICS_LOG"
    echo ""
}

# Main monitoring function
main() {
    local exit_code=0

    log_message "INFO" "Starting email queue monitoring check"

    # Rotate logs if needed
    rotate_logs

    # Run all checks
    check_pm2_processes || exit_code=1
    check_redis_connection || exit_code=1
    check_queue_health || exit_code=1
    check_queue_metrics || exit_code=1
    check_system_resources || exit_code=1

    # Send notifications for critical issues
    if [ $exit_code -ne 0 ]; then
        send_notification "Email queue monitoring detected issues. Check logs for details."
    fi

    log_message "INFO" "Email queue monitoring check completed (exit code: $exit_code)"

    # Generate summary if running interactively
    if [ -t 1 ]; then
        generate_summary $exit_code
    fi

    exit $exit_code
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Email Queue Monitoring Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --quiet, -q         Suppress output (for cron jobs)"
        echo "  --config            Show current configuration"
        echo ""
        echo "Environment Variables:"
        echo "  REDIS_HOST                      Redis hostname (default: localhost)"
        echo "  REDIS_PORT                      Redis port (default: 6379)"
        echo "  API_HOST                        API hostname (default: localhost)"
        echo "  API_PORT                        API port (default: 3000)"
        echo "  ALERT_THRESHOLD_QUEUE_DEPTH     Queue depth alert threshold (default: 1000)"
        echo "  ALERT_THRESHOLD_ERROR_RATE      Error rate alert threshold % (default: 5)"
        echo "  WEBHOOK_URL                     Webhook URL for notifications (optional)"
        echo ""
        exit 0
        ;;
    --config)
        echo "Current Configuration:"
        echo "  Redis: ${REDIS_HOST}:${REDIS_PORT}"
        echo "  API: ${API_HOST}:${API_PORT}"
        echo "  Queue Depth Threshold: ${ALERT_THRESHOLD_QUEUE_DEPTH}"
        echo "  Error Rate Threshold: ${ALERT_THRESHOLD_ERROR_RATE}%"
        echo "  Log Directory: ${LOG_DIR}"
        exit 0
        ;;
    --quiet|-q)
        exec > /dev/null 2>&1
        ;;
esac

# Run main function
main