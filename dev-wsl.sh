#!/bin/bash
# WSL Development Helper for SplitSheet App
# This script helps resolve WSL/Windows compatibility issues

echo "🚀 Starting WSL Development Server for Windows Access..."

# Set environment variables for WSL compatibility
export NODE_ENV=development
export NEXT_TELEMETRY_DISABLED=1
export WATCHPACK_POLLING=true

# Clear any existing .next directory that might have platform-specific binaries
echo "🧹 Cleaning build artifacts..."
rm -rf .next

# Clear npm cache to avoid platform-specific binary issues
echo "🔄 Clearing npm cache..."
npm cache clean --force

# Reinstall dependencies to ensure correct platform binaries
echo "📦 Rebuilding dependencies for current platform..."
npm install

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Start development server with polling for WSL compatibility
echo "🌟 Starting development server..."
echo "📱 Access your app at: http://localhost:3000"
echo "⚡ WSL polling enabled for Windows file watching"

next dev --hostname 0.0.0.0 --port 3000