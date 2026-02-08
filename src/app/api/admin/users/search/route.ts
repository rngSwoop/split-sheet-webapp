import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (currentUser.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(request.url);
  const q = String(url.searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ users: [] });

  try {
    const profiles = await prisma.profile.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { userId: true, name: true, role: true },
      take: 20,
    });

    const userIds = profiles.map((p) => p.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });

    const results = profiles.map((p) => ({
      ...p,
      email: users.find((u) => u.id === p.userId)?.email,
    }));

    return NextResponse.json({ users: results });
  } catch (err) {
    console.error('admin user search error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
