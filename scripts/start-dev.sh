#!/bin/bash

# Start development environment for Handmade E-commerce Platform

echo "🚀 Starting Handmade E-commerce Platform..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
  echo "⚠️  PostgreSQL is not running on localhost:5432"
  echo "   Please start PostgreSQL before running the application"
  echo ""
  echo "   macOS (Homebrew): brew services start postgresql@15"
  echo "   Linux: sudo systemctl start postgresql"
  echo ""
fi

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
  echo "⚠️  Redis is not running on localhost:6379"
  echo "   Please start Redis before running the application"
  echo ""
  echo "   macOS (Homebrew): brew services start redis"
  echo "   Linux: sudo systemctl start redis"
  echo ""
fi

echo "✨ Development environment check complete!"
echo ""
echo "📊 Required Services:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "🎯 Next steps:"
echo "  1. Run 'npm run dev' to start frontend and backend"
echo "  2. Frontend: http://localhost:3000"
echo "  3. Backend API: http://localhost:3001"
echo ""
