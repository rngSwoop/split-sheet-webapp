@echo off
REM Windows Development Helper for SplitSheet App
REM This script resolves Windows/WSL compatibility issues

echo 🚀 Starting Windows Development Server...

REM Set environment variables
set NODE_ENV=development
set NEXT_TELEMETRY_DISABLED=1

REM Clear build artifacts
echo 🧹 Cleaning build artifacts...
if exist .next rmdir /s /q .next

REM Clear npm cache
echo 🔄 Clearing npm cache...
call npm cache clean --force

REM Reinstall dependencies to ensure correct platform binaries
echo 📦 Rebuilding dependencies for Windows...
call npm install

REM Generate Prisma client
echo 🗄️ Generating Prisma client...
call npx prisma generate

REM Start development server
echo 🌟 Starting development server...
echo 📱 Access your app at: http://localhost:3000
echo ⚡ Ready for Windows development

call npm run dev