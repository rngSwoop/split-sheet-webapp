import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    // Try User table first (primary source of role)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (user) {
      // Check if profile exists and sync roles if needed
      const profile = await prisma.profile.findUnique({ where: { userId } });
      if (profile && profile.role !== user.role) {
        // Sync profile role to match user role
        await prisma.profile.update({
          where: { userId },
          data: { role: user.role },
        });
      }
      return NextResponse.json({ role: user.role || 'ARTIST' });
    }

    // Fallback to profile if no user found (shouldn't happen in normal flow)
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (profile) {
      return NextResponse.json({ role: profile.role || 'ARTIST' });
    }

    // Default to ARTIST if nothing found
    return NextResponse.json({ role: 'ARTIST' });
  } catch (err) {
    console.error('get-role error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
