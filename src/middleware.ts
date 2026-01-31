// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';

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

  // Redirect generic /dashboard to role-specific dashboard
  if (req.nextUrl.pathname === '/dashboard' || req.nextUrl.pathname === '/dashboard/') {
    if (user) {
      const prismaUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      const rolePath = (prismaUser?.role || 'ARTIST').toLowerCase();
      return NextResponse.redirect(new URL(`/dashboard/${rolePath}`, req.url));
    }
  }

  // Protect /admin routes (only ADMIN can access)
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    const prismaUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (prismaUser?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};