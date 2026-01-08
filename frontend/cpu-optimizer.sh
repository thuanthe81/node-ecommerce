#!/bin/bash

# CPU Optimizer Script
# Automatically manages system processes to reduce CPU usage during builds

echo "🔧 CPU Optimizer - Reducing system load for builds..."

# Function to reduce priority of high CPU processes
reduce_cpu_usage() {
    echo "📊 Analyzing high CPU processes..."

    # Find processes using more than 10% CPU
    HIGH_CPU_PIDS=$(ps aux | awk '$3 > 10.0 {print $2}' | tail -n +2)

    if [ -n "$HIGH_CPU_PIDS" ]; then
        echo "⚠️  Found high CPU processes, reducing their priority..."

        for pid in $HIGH_CPU_PIDS; do
            # Check if process exists and get its name
            if kill -0 "$pid" 2>/dev/null; then
                PROCESS_NAME=$(ps -p "$pid" -o comm= 2>/dev/null)

                # Skip critical system processes
                case "$PROCESS_NAME" in
                    "kernel"*|"kthread"*|"migration"*|"rcu_"*|"watchdog"*)
                        echo "⏭️  Skipping system process: $PROCESS_NAME (PID: $pid)"
                        continue
                        ;;
                esac

                # Reduce priority for non-critical processes
                if command -v renice >/dev/null 2>&1; then
                    echo "📉 Reducing priority for $PROCESS_NAME (PID: $pid)"
                    renice +10 "$pid" >/dev/null 2>&1
                fi

                # Reduce I/O priority if ionice is available
                if command -v ionice >/dev/null 2>&1; then
                    ionice -c 3 -p "$pid" >/dev/null 2>&1
                fi
            fi
        done
    else
        echo "✅ No high CPU processes found"
    fi
}

# Function to manage snapd and ssm-agent (Ubuntu specific)
manage_ubuntu_services() {
    echo "🐧 Managing Ubuntu-specific services..."

    # Reduce snapd priority if running
    SNAPD_PID=$(pgrep snapd)
    if [ -n "$SNAPD_PID" ]; then
        echo "📦 Reducing snapd priority..."
        renice +15 "$SNAPD_PID" >/dev/null 2>&1
        ionice -c 3 -p "$SNAPD_PID" >/dev/null 2>&1
    fi

    # Reduce amazon-ssm-agent priority if running
    SSM_PID=$(pgrep amazon-ssm-agent)
    if [ -n "$SSM_PID" ]; then
        echo "☁️  Reducing amazon-ssm-agent priority..."
        renice +15 "$SSM_PID" >/dev/null 2>&1
        ionice -c 3 -p "$SSM_PID" >/dev/null 2>&1
    fi
}

# Function to set CPU governor to powersave (if available)
set_cpu_governor() {
    if [ -d "/sys/devices/system/cpu/cpu0/cpufreq" ]; then
        echo "⚡ Setting CPU governor to powersave mode..."

        for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
            if [ -w "$cpu" ]; then
                echo "powersave" | sudo tee "$cpu" >/dev/null 2>&1
            fi
        done
    fi
}

# Function to limit CPU frequency (if available)
limit_cpu_frequency() {
    if command -v cpufreq-set >/dev/null 2>&1; then
        echo "🔄 Limiting CPU frequency for power saving..."

        # Get number of CPUs
        NUM_CPUS=$(nproc)

        for ((i=0; i<NUM_CPUS; i++)); do
            # Set to 70% of max frequency
            cpufreq-set -c "$i" -u 70% >/dev/null 2>&1
        done
    fi
}

# Function to create a CPU usage monitor
start_cpu_monitor() {
    echo "📈 Starting CPU usage monitor..."

    # Create a background monitor that logs CPU usage
    (
        while true; do
            CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
            TIMESTAMP=$(date '+%H:%M:%S')

            if [ -n "$CPU_USAGE" ]; then
                # Log high CPU usage
                if (( $(echo "$CPU_USAGE > 80" | bc -l 2>/dev/null || echo "0") )); then
                    echo "[$TIMESTAMP] ⚠️  High CPU usage: ${CPU_USAGE}%" >> cpu-monitor.log
                fi
            fi

            sleep 10
        done
    ) &

    MONITOR_PID=$!
    echo "📊 CPU monitor started (PID: $MONITOR_PID)"
    echo "$MONITOR_PID" > cpu-monitor.pid
}

# Function to stop CPU monitor
stop_cpu_monitor() {
    if [ -f "cpu-monitor.pid" ]; then
        MONITOR_PID=$(cat cpu-monitor.pid)
        if kill -0 "$MONITOR_PID" 2>/dev/null; then
            kill "$MONITOR_PID"
            echo "🛑 CPU monitor stopped"
        fi
        rm -f cpu-monitor.pid
    fi
}

# Main execution
case "${1:-optimize}" in
    "optimize")
        echo "🚀 Running full CPU optimization..."
        reduce_cpu_usage
        manage_ubuntu_services
        set_cpu_governor
        limit_cpu_frequency
        start_cpu_monitor
        echo "✅ CPU optimization completed!"
        echo "💡 Run '$0 restore' to restore normal settings after build"
        ;;

    "monitor")
        start_cpu_monitor
        echo "📊 CPU monitoring started. Check cpu-monitor.log for high usage alerts."
        ;;

    "stop-monitor")
        stop_cpu_monitor
        ;;

    "restore")
        echo "🔄 Restoring normal CPU settings..."
        stop_cpu_monitor

        # Restore CPU governor to performance (if available)
        if [ -d "/sys/devices/system/cpu/cpu0/cpufreq" ]; then
            for cpu in /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor; do
                if [ -w "$cpu" ]; then
                    echo "performance" | sudo tee "$cpu" >/dev/null 2>&1
                fi
            done
        fi

        # Remove CPU frequency limits
        if command -v cpufreq-set >/dev/null 2>&1; then
            NUM_CPUS=$(nproc)
            for ((i=0; i<NUM_CPUS; i++)); do
                cpufreq-set -c "$i" -g performance >/dev/null 2>&1
            done
        fi

        echo "✅ Normal CPU settings restored!"
        ;;

    *)
        echo "Usage: $0 {optimize|monitor|stop-monitor|restore}"
        echo "  optimize     - Reduce CPU usage for builds"
        echo "  monitor      - Start CPU usage monitoring"
        echo "  stop-monitor - Stop CPU monitoring"
        echo "  restore      - Restore normal CPU settings"
        exit 1
        ;;
esac