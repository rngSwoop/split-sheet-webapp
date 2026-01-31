import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const q = String(url.searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ artists: [] });

  try {
    // Search profiles by name (case-insensitive) or users by email
    const profiles = await prisma.profile.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
        ],
        // optionally filter by not already assigned? we'll return all matches
      },
      select: { userId: true, name: true, role: true, labelId: true },
      take: 20,
    });

    const userIds = profiles.map(p => p.userId);
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } });

    const results = profiles.map(p => ({ ...p, email: users.find(u => u.id === p.userId)?.email }));
    return NextResponse.json({ artists: results });
  } catch (err) {
    console.error('search artists error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
