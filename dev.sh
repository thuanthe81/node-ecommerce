#!/bin/bash

# Development script to run both frontend and backend
echo "Starting development servers..."

# Function to cleanup background processes on exit
cleanup() {
    echo "Stopping development servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start backend in background
echo "Starting backend..."
cd backend && npm run start:dev &
BACKEND_PID=$!

# Start frontend in background
echo "Starting frontend..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

# Wait for both processes
echo "Both servers started. Press Ctrl+C to stop."
wait