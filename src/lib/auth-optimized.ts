// src/lib/auth-optimized.ts
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

export async function getCurrentUserOptimized() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {} // Ignore in Server Components
        },
        remove(name, options) {
          try {
            cookieStore.delete({ name, ...options });
          } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Try to get role from cached user_metadata first (fast path)
  const cachedRole = user.user_metadata?.role;
  const cachedUsername = user.user_metadata?.username;
  
  if (cachedRole) {
    console.log('🎯 Using cached role from user_metadata:', cachedRole);
    return {
      id: user.id,
      email: user.email,
      role: cachedRole,
      name: user.user_metadata?.name,
      username: cachedUsername,
      _source: 'cached' // Track data source for debugging
    };
  }

  // Fallback to database (slow path - should only happen for existing users)
  console.log('🔄 No cached role found, querying database');
  const prismaUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      username: true,
    },
  });

  if (prismaUser) {
    // Cache the role for future requests
    try {
      // Check if service role key is available
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'sb_service_role_KEY_HERE') {
        console.warn('⚠️ Auth optimized: SUPABASE_SERVICE_ROLE_KEY not configured, skipping metadata caching');
      } else {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: { 
            role: prismaUser.role,
            username: prismaUser.username,
            name: prismaUser.name
          }
        });
        console.log('✅ Cached role in user_metadata:', prismaUser.role);
      }
    } catch (error) {
      console.warn('⚠️ Failed to cache role:', error);
    }

    return {
      ...prismaUser,
      _source: 'database' // Track data source for debugging
    };
  }

  return null;
}

export async function getUserRoleOptimized() {
  const user = await getCurrentUserOptimized();
  return user?.role || 'ARTIST';
}