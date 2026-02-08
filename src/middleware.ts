// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

// Force Node.js runtime (required for Prisma + crypto)
export const runtime = 'nodejs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login for protected paths
  if (!user && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Single query optimization: Cache user role lookup per request
  let userRole: string | null = null;
  
  const getUserRoleOptimized = async () => {
    if (userRole) return userRole; // Return cached role if already fetched
    
    // Try cached user_metadata first (fast path)
    const cachedRole = user?.user_metadata?.role;
    if (cachedRole) {
      console.log('🎯 Middleware: Using cached role from user_metadata:', cachedRole);
      userRole = cachedRole;
      return cachedRole;
    }
    
    // Fallback to database (slow path)
    console.log('🔄 Middleware: No cached role, querying database');
    const prismaUser = await prisma.user.findUnique({
      where: { 
        id: user!.id, // Non-null assertion - this function is only called when user exists
        deletedAt: null  // 🆕 Exclude deleted users
      },
      select: { role: true },
    });

    if (prismaUser) {
      userRole = prismaUser.role;
// Cache for future requests
      try {
        // Check if service role key is available
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'sb_service_role_KEY_HERE') {
          console.warn('⚠️ Middleware: SUPABASE_SERVICE_ROLE_KEY not configured, skipping metadata caching');
        } else {
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          
          await supabaseAdmin.auth.admin.updateUserById(user!.id, {
            user_metadata: { role: prismaUser.role }
          });
          console.log('✅ Middleware: Cached role in user_metadata:', prismaUser.role);
        }
      } catch (error) {
        console.warn('⚠️ Middleware: Failed to cache role:', error);
      }
    }
    
    return userRole;
  };

// Redirect generic /dashboard to role-specific dashboard
  if (req.nextUrl.pathname === '/dashboard' || req.nextUrl.pathname === '/dashboard/') {
    if (user) {
      const prismaUser = await prisma.user.findUnique({
        where: { 
          id: user.id,
          deletedAt: null  // 🆕 Exclude deleted users
        },
        select: { role: true },
      });

      if (prismaUser) {
        const rolePath = prismaUser.role.toLowerCase();
        return NextResponse.redirect(new URL(`/dashboard/${rolePath}`, req.url));
      }
      // Fallback to ARTIST if user not found
      return NextResponse.redirect(new URL('/dashboard/artist', req.url));
    }
  }

  // Protect role-specific dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard/')) {
    const pathSegments = req.nextUrl.pathname.split('/');
    const requestedRole = pathSegments[2]?.toUpperCase(); // Extract role from /dashboard/role/...
    
    if (user && requestedRole && ['ARTIST', 'LABEL', 'ADMIN'].includes(requestedRole)) {
      const role = await getUserRoleOptimized();
      if (role && role !== requestedRole) {
        // Redirect to correct dashboard if accessing wrong role
        const correctRolePath = role.toLowerCase();
        return NextResponse.redirect(new URL(`/dashboard/${correctRolePath}`, req.url));
      }
    }
  }

  // Protect /admin routes (only ADMIN can access)
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    const role = await getUserRoleOptimized();
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};