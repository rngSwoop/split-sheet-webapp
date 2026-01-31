# Cross-Platform Development Workflow

## Overview
This project uses a Windows-primary, Linux-compatible development workflow to support seamless collaboration between Windows development environment and Linux-based AI assistance.

## Environment Roles

### Windows (Primary Development)
- **Platform**: Windows VS Code with Windows terminals
- **Purpose**: Main development environment
- **Responsibilities**: 
  - Running `npm run dev` and testing
  - Installing dependencies (`npm install`)
  - Database operations (`db:push`, `db:studio`)
  - Build and deployment tasks

### Linux (AI Assistance)
- **Platform**: Linux WSL environment  
- **Purpose**: File modifications and code analysis
- **Responsibilities**:
  - Code editing and improvements
  - File system operations
  - Code analysis and documentation
  - No running development servers

## Development Workflow

### When AI Makes Changes
1. **Code Modifications**: Files saved to shared file system
2. **Change Summary**: Detailed explanation of modifications
3. **Testing Instructions**: Specific Windows testing steps provided
4. **Environment Switch**: User switches to Windows to test

### When User Tests in Windows
1. **Stop Conflicting Processes**: Ensure no running Next.js instances
2. **Clean Build** (if needed): `npm run clean:build`
3. **Run Development**: `npm run dev` in Windows terminal
4. **Feedback Loop**: Report results back to AI

## Package.json Scripts

### Windows Development Commands
```bash
npm run dev                # Standard development (Windows-optimized)
npm run dev:windows        # Explicit Windows development
npm run setup:windows      # Clean and start development
```

### Maintenance Commands
```bash
npm run clean:build        # Remove .next build directory
npm run clean:all         # Remove .next and node_modules
npm run reset:env          # Reset environment from backup
```

### Database Commands
```bash
npm run db:push           # Push schema changes (Windows only)
npm run db:migrate         # Run database migrations (Windows only)
npm run db:studio          # Open Prisma Studio (Windows only)
```

## Common Issues & Solutions

### 1. "Unable to acquire lock" Error
**Cause**: Previous Next.js process still running
**Solution (Windows PowerShell)**:
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
Remove-Item .next\dev\lock -Force
```

### 2. Lightning CSS Module Errors
**Cause**: Cross-platform module architecture mismatch
**Solution**: Always run `npm install` from Windows environment

### 3. File Permission Issues
**Cause**: WSL vs Windows file system conflicts
**Solution**: Use Windows terminals for file operations

## Environment Switching Protocol

### From AI to User Testing
1. **AI**: "Changes complete. Please switch to Windows and run: `npm run setup:windows`"
2. **User**: Switch to Windows environment
3. **User**: Run the specified command
4. **User**: Report results back to AI

### From User to AI Assistance
1. **User**: "I need help with [specific task]"
2. **AI**: Analyze and implement changes
3. **AI**: Provide detailed change summary
4. **AI**: Give specific testing instructions

## File System Considerations

### Directories
- `.next/` - Windows build artifacts (clean when needed)
- `node_modules/` - Windows native modules
- `.env` - Environment configuration (shared)

### Git Workflow
- **Ignore**: `.next/`, `node_modules/`, `.env*`
- **Track**: All source code changes
- **Conflict Prevention**: AI avoids Windows-specific operations

## Best Practices

### For User (Windows)
1. Always use Windows PowerShell/CMD for terminal operations
2. Run `npm run setup:windows` for clean development start
3. Keep VS Code in Windows environment
4. Install dependencies only from Windows

### For AI (Linux)
1. Focus on code modifications only
2. Avoid running development servers
3. Use Windows file paths when needed
4. Provide detailed change explanations

## Emergency Procedures

### If Development Server Won't Start
```bash
# In Windows PowerShell
npm run clean:build
npm run setup:windows
```

### If Dependencies Are Corrupted
```bash
# In Windows PowerShell
npm run clean:all
npm install
npm run setup:windows
```

### If Database Connection Fails
```bash
# In Windows PowerShell
npm run db:studio  # Check database status
npm run db:push      # Push schema changes
```