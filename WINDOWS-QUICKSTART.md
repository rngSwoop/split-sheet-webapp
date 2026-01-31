# Windows Development Quick Start

## Instructions for Switching from Linux to Windows Development

When the AI assistant completes changes and asks you to test in Windows, follow these steps:

### 1. Stop Current Processes (if any)
**In Windows PowerShell:**
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Remove-Item .next\dev\lock -Force -ErrorAction SilentlyContinue
```

### 2. Switch to Windows Environment
- Close any WSL terminals
- Open VS Code in Windows (if not already)
- Use Windows PowerShell or CMD terminal

### 3. Navigate to Project Directory
**In Windows PowerShell:**
```powershell
cd "C:\Users\garre\OneDrive\Documents\Apps\2026\split-sheet-dev\split-sheet-app"
```

### 4. Start Development
**Quick Start:**
```bash
npm run setup:windows
```

**Or Step by Step:**
```bash
npm run clean:build
npm run dev
```

### 5. Test the Application
1. Open browser to http://localhost:3000
2. Test the specific features mentioned by AI
3. Report results back to AI

### 6. Common Issues & Solutions

**"Unable to acquire lock" Error:**
```powershell
npm run clean:build
npm run setup:windows
```

**"Cannot find lightningcss" Error:**
```powershell
npm install
npm run setup:windows
```

**Database Connection Issues:**
```powershell
npm run db:studio
# Check database status, then:
npm run db:push
```

### 7. When Testing is Complete
- Report success/failure to AI
- Describe any issues encountered
- Provide feedback on new functionality

---

## Testing Username Login Feature

After the AI completes username login implementation, test:

1. **Existing User Login:**
   - Try login with existing email
   - Try login with generated username (check `api/admin/migrate-usernames` results)
   - Both should work identically

2. **New User Signup:**
   - Create new account with username field
   - Verify username appears in database
   - Test login with new username

3. **Error Cases:**
   - Try non-existent username
   - Try invalid email formats
   - Verify proper error messages

## AI Workflow Notes

- AI will modify files from Linux
- AI will provide specific testing instructions
- AI will never run `npm run dev` from Linux
- All development server operations happen in Windows

This ensures clean separation between AI assistance and user testing.