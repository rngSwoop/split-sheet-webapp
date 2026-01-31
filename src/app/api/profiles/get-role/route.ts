import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    // Try Profile first
    let profile = await prisma.profile.findUnique({ where: { userId } });

    // If no profile, fall back to User table
    if (!profile) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        return NextResponse.json({ role: user.role || 'ARTIST' });
      }
      // If no user either, default to ARTIST (don't block UI)
      return NextResponse.json({ role: 'ARTIST' });
    }

    return NextResponse.json({ role: profile.role || 'ARTIST' });
  } catch (err) {
    console.error('get-role error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
