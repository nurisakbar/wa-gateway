#!/bin/bash

# Script untuk restart development server dengan clear cache
echo "🔄 Restarting WA Gateway Frontend Development Server..."
echo "=================================================="

# Stop any running development server
echo "⏹️  Stopping any running development server..."
pkill -f "nuxt dev" 2>/dev/null || true

# Clear Nuxt cache
echo "🧹 Clearing Nuxt cache..."
rm -rf .nuxt .output

# Clear node_modules cache (optional)
echo "🧹 Clearing node_modules cache..."
rm -rf node_modules/.cache

# Install dependencies (if needed)
echo "📦 Checking dependencies..."
npm install

# Start development server
echo "🚀 Starting development server..."
echo "   Frontend will be available at: http://localhost:3000"
echo "   API calls will be made to: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================================="

npm run dev
