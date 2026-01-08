#!/bin/bash

# Ultra-optimized build script for low CPU usage
# This script aggressively reduces CPU usage during builds

echo "🚀 Starting ultra-low CPU frontend build..."

# Set aggressive environment variables for minimal resource usage
export NODE_OPTIONS="--max-old-space-size=384 --max-semi-space-size=16 --gc-interval=100"
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production
export UV_THREADPOOL_SIZE=1
export NEXT_CACHE_HANDLER="./cache-handler-minimal.js"

# Disable unnecessary features
export NEXT_DISABLE_SWC=1
export DISABLE_ESLINT_PLUGIN=1

# Set CPU and I/O priority to lowest
if command -v nice >/dev/null 2>&1; then
    echo "📊 Setting lowest CPU priority..."
    NICE_CMD="nice -n 19"
else
    NICE_CMD=""
fi

if command -v ionice >/dev/null 2>&1; then
    echo "💾 Setting lowest I/O priority..."
    IONICE_CMD="ionice -c 3 -n 7"
else
    IONICE_CMD=""
fi

# Check system resources and select appropriate build mode
if command -v free >/dev/null 2>&1; then
    AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    echo "💻 Available memory: ${AVAILABLE_MEM}MB"

    if [ "$AVAILABLE_MEM" -lt 1024 ]; then
        echo "⚠️  Very low memory detected, using single-threaded build..."
        BUILD_SCRIPT="build:single-thread"
    elif [ "$AVAILABLE_MEM" -lt 2048 ]; then
        echo "⚠️  Low memory detected, using ultra-low CPU build..."
        BUILD_SCRIPT="build:ultra-low"
    else
        BUILD_SCRIPT="build:minimal"
    fi
else
    # macOS fallback
    AVAILABLE_MEM=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//' | awk '{print $1 * 4096 / 1024 / 1024}')
    echo "💻 Available memory: ${AVAILABLE_MEM}MB (estimated)"
    BUILD_SCRIPT="build:ultra-low"
fi

# Limit CPU cores if possible
if command -v taskset >/dev/null 2>&1; then
    echo "🔧 Limiting to single CPU core..."
    TASKSET_CMD="taskset -c 0"
else
    TASKSET_CMD=""
fi

# Create temporary swap if memory is very low (Linux only)
if [ "$AVAILABLE_MEM" -lt 512 ] && command -v fallocate >/dev/null 2>&1; then
    echo "💾 Creating temporary swap file..."
    sudo fallocate -l 512M /tmp/build_swap
    sudo mkswap /tmp/build_swap
    sudo swapon /tmp/build_swap
    CLEANUP_SWAP=true
fi

# Run the build with maximum resource constraints
echo "🔧 Running build with script: $BUILD_SCRIPT"
echo "⚡ Using minimal resource settings..."

# Set process limits
ulimit -v 524288  # Limit virtual memory to 512MB
ulimit -m 524288  # Limit physical memory to 512MB

# Run build with all optimizations
$TASKSET_CMD $IONICE_CMD $NICE_CMD npm run $BUILD_SCRIPT

BUILD_EXIT_CODE=$?

# Cleanup temporary swap if created
if [ "$CLEANUP_SWAP" = true ]; then
    echo "🧹 Cleaning up temporary swap..."
    sudo swapoff /tmp/build_swap
    sudo rm -f /tmp/build_swap
fi

# Check build success
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ Build completed successfully!"

    # Show build statistics
    if [ -d ".next" ]; then
        BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
        echo "📏 Build size: $BUILD_SIZE"

        # Count files to show optimization
        FILE_COUNT=$(find .next -type f | wc -l)
        echo "📁 Files generated: $FILE_COUNT"
    fi

    echo "🎉 Ultra-low CPU build process completed!"
else
    echo "❌ Build failed with exit code: $BUILD_EXIT_CODE"
    echo "💡 Try running with even lower memory settings or check system resources"
    exit $BUILD_EXIT_CODE
fi