#!/bin/bash

# Stop development environment

echo "🛑 Stopping development servers..."
echo ""
echo "Note: PostgreSQL and Redis are managed by your system."
echo "To stop them manually:"
echo ""
echo "  macOS (Homebrew):"
echo "    brew services stop postgresql@15"
echo "    brew services stop redis"
echo ""
echo "  Linux:"
echo "    sudo systemctl stop postgresql"
echo "    sudo systemctl stop redis"
echo ""
