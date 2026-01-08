#!/bin/bash

# Monitor system resources during build
# Usage: ./monitor-build.sh &

echo "🔍 Starting build monitoring..."
echo "📊 Monitoring CPU and memory usage every 5 seconds..."
echo "💡 Press Ctrl+C to stop monitoring"

# Create log file with timestamp
LOG_FILE="build-monitor-$(date +%Y%m%d-%H%M%S).log"
echo "📝 Logging to: $LOG_FILE"

# Header for log file
echo "Timestamp,CPU%,Memory%,LoadAvg,Processes" > "$LOG_FILE"

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    # Get CPU usage (1-minute average)
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')

    # Get memory usage
    MEMORY_INFO=$(free | grep Mem)
    TOTAL_MEM=$(echo $MEMORY_INFO | awk '{print $2}')
    USED_MEM=$(echo $MEMORY_INFO | awk '{print $3}')
    MEMORY_PERCENT=$(awk "BEGIN {printf \"%.1f\", ($USED_MEM/$TOTAL_MEM)*100}")

    # Get load average
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')

    # Count Node.js processes
    NODE_PROCESSES=$(pgrep -c node || echo "0")

    # Display current stats
    echo "⏰ $TIMESTAMP | CPU: ${CPU_USAGE:-"N/A"}% | Memory: ${MEMORY_PERCENT}% | Load: ${LOAD_AVG} | Node processes: $NODE_PROCESSES"

    # Log to file
    echo "$TIMESTAMP,${CPU_USAGE:-"0"},${MEMORY_PERCENT},${LOAD_AVG},${NODE_PROCESSES}" >> "$LOG_FILE"

    # Check if system is under heavy load
    if (( $(echo "$MEMORY_PERCENT > 90" | bc -l) )); then
        echo "⚠️  WARNING: High memory usage detected (${MEMORY_PERCENT}%)"
    fi

    sleep 5
done