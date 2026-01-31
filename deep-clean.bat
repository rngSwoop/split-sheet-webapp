@echo off
echo 🧹 Deep Clean Windows Environment

echo Step 1: Remove ALL build artifacts...
if exist .next rmdir /s /q .next
if exist .nuxt rmdir /s /q .nuxt
if exist .turbo rmdir /s /q .turbo
if exist .cache rmdir /s /q .cache

echo Step 2: Clear ALL caches...
call npm cache clean --force
if exist %USERPROFILE%\.npm rmdir /s /q "%USERPROFILE%\.npm" 2>nul
if exist %USERPROFILE%\.cache rmdir /s /q "%USERPROFILE%\.cache" 2>nul
if exist %LOCALAPPDATA%\.cache rmdir /s /q "%LOCALAPPDATA%\.cache" 2>nul

echo Step 3: Clear node_modules subdirectories...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist node_modules\.bin rmdir /s /q node_modules\.bin
if exist node_modules\.terser rmdir /s /q node_modules\.terser

echo Step 4: Reinstall fresh...
call npm install --no-audit --no-fund

echo Step 5: Generate fresh Prisma client...
call npx prisma generate

echo Step 6: Start clean development server...
echo 🚀 Ready to go! Access at: http://localhost:3000

call npm run dev