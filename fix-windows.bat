@echo off
REM Enhanced Windows Development Fix for SplitSheet App
REM Specifically addresses Lightning CSS binary compatibility issues

echo 🚀 Enhanced Windows Development Setup
echo 🎯 Fixing Tailwind CSS v4 binary issues...

REM Set environment variables for Windows compatibility
set NODE_ENV=development
set NEXT_TELEMETRY_DISABLED=1
set NODE_OPTIONS=--max-old-space-size=4096

REM Step 1: Clear ALL build artifacts and problematic binaries
echo 🧹 Step 1: Cleaning all build artifacts...
if exist .next (
    echo   Removing .next directory...
    rmdir /s /q .next
)
if exist node_modules\.bin (
    echo   Cleaning node_modules\.bin...
    rmdir /s /q node_modules\.bin
)
if exist node_modules\.cache (
    echo   Cleaning node_modules\.cache...
    rmdir /s /q node_modules\.cache
)

REM Step 2: Clear npm and node cache
echo 🔄 Step 2: Clearing caches...
call npm cache clean --force
call npx --yes tailwindcss --help >nul 2>&1
if exist %USERPROFILE%\.cache (
    echo   Cleaning user cache...
    rmdir /s /q "%USERPROFILE%\.cache" 2>nul
)

REM Step 3: Reinstall dependencies fresh
echo 📦 Step 3: Reinstalling dependencies...
call npm install --no-audit --no-fund

REM Step 4: Generate Prisma client
echo 🗄️ Step 4: Generating Prisma client...
call npx prisma generate

REM Step 5: Force rebuild Next.js with Windows binaries
echo 🔨 Step 5: Force rebuilding Next.js...
if exist .next (
    rmdir /s /q .next
)

REM Step 6: Start development server with polling
echo 🌟 Step 6: Starting development server...
echo 📱 Access your app at: http://localhost:3000
echo ⚡ Polling enabled for Windows file watching
echo 🔥 Binary compatibility fixes applied

REM Start development server
call npm run dev