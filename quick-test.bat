@echo off
echo 🚀 Quick Windows Development Test
echo.

REM Quick clean and restart
if exist .next rmdir /s /q .next

echo 📦 Starting development server...
call npm run dev

pause