// src/lib/auth.ts (fixed for async cookies)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

export async function getCurrentUser() {
  const cookieStore = await cookies(); // ← AWAIT here!

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

  const prismaUser = await prisma.user.findUnique({
    where: { 
      id: user.id,
      deletedAt: null  // 🆕 Exclude deleted users
    },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      deletedAt: true,  // Include deletedAt for UI checks
    },
  });

  return prismaUser;
}