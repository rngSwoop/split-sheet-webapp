# AGENTS.md

This file contains guidelines and commands for agentic coding agents working in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server (generates Prisma client first)
- `npm run build` - Build for production (generates Prisma client first)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint on the codebase

### Database Commands
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio for database inspection
- `npm run prisma:generate` - Generate Prisma client

### Running Tests
This project doesn't have explicit test scripts configured. Check with the user for testing approach before implementing test-related changes.

## Code Style Guidelines

### Project Overview
- **Tech Stack**: Next.js 16.1.1, React 19, TypeScript, Prisma 7, PostgreSQL, Supabase Auth
- **Architecture**: App Router, Server Components, API Routes
- **Styling**: Tailwind CSS v4 with custom glass morphism design
- **Database**: PostgreSQL with Prisma ORM (client engine)

### Import Conventions
```typescript
// External libraries first
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { clsx } from 'clsx';

// Internal imports using @ alias
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { cn } from '@/lib/utils';
```

### TypeScript Configuration
- Strict mode enabled
- Path aliases: `@/*` → `./src/*`
- JSX transform: `react-jsx`
- Target: ES2017

### Component Patterns

#### Server Components (default)
```typescript
// No 'use client' directive
import { getCurrentUser } from '@/lib/auth';

export default async function Page() {
  const user = await getCurrentUser();
  // Server-side logic here
}
```

#### Client Components
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function InteractiveComponent() {
  const [count, setCount] = useState(0);
  // Client-side logic here
}
```

#### UI Component Pattern
```typescript
'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
}

const Component = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn('base-styles', variant === 'outline' && 'outline-styles', className)}
        {...props}
      />
    );
  }
);

Component.displayName = 'Component';
export default Component;
```

### API Route Patterns
```typescript
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Database operations
    const data = await prisma.model.findMany();
    return NextResponse.json({ data });
  } catch (err) {
    console.error('api error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
```

### Database Patterns
- Use the singleton `prisma` instance from `@/lib/prisma`
- Always include error handling with try/catch
- Use Prisma's include for relations: `include: { contributors: true }`
- Handle optional user relationships: `userId?` and `user?` in relations

### Naming Conventions
- **Files**: kebab-case for folders (`splits/new/`), PascalCase for components (`GlassButton.tsx`)
- **Components**: PascalCase (`SplitSheetForm`)
- **Functions**: camelCase (`getCurrentUser`, `createSplitSheet`)
- **Constants**: UPPER_SNAKE_CASE for environment variables
- **Variables**: camelCase with descriptive names

### Error Handling
```typescript
// API Routes
try {
  const result = await operation();
  return NextResponse.json({ result });
} catch (err) {
  console.error('operation error', err);
  return NextResponse.json({ error: 'Internal' }, { status: 500 });
}

// Auth Guards
const currentUser = await getCurrentUser();
if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// Validation
if (!requiredField) {
  return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
}
```

### Utility Functions
- Use `cn()` for className merging with Tailwind
- Import utilities from `@/lib/utils`
- Follow existing patterns for auth (`getCurrentUser`) and database access

### CSS/Style Guidelines
- Use Tailwind classes, no custom CSS files
- Glass morphism design system (see `GlassButton`)
- Responsive design with Tailwind breakpoints
- Use `className={cn(...)}` for conditional classes

### Environment Variables
- Use `.env.local` for local development
- Database: `DATABASE_URL`
- Supabase config for auth
- Use `dotenv-cli` for database commands with environment

### File Structure
```
src/
├── app/                 # Next.js App Router pages
├── components/ui/       # Reusable UI components
├── lib/                # Utility functions and configurations
├── middleware.ts       # Next.js middleware
└── globals.css         # Global styles
```

### Development Workflow
1. Always run `npm run lint` after making changes
2. Run `npm run db:push` after Prisma schema changes
3. Test API endpoints using proper authentication
4. Follow Next.js App Router conventions for routing

### Security Notes
- Always validate user authentication in API routes
- Use proper TypeScript types for database operations
- Never expose sensitive environment variables to client
- Validate input data before database operations

### Testing Notes
- No test framework currently configured
- Manual testing through development server
- API testing through browser dev tools or Postman
- Database testing through Prisma Studio (`npm run db:studio`)