import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Find current user's profile to get labelId
    const profile = await prisma.profile.findUnique({ where: { userId: currentUser.id } });
    if (!profile || !profile.labelId) {
      return NextResponse.json({ artists: [] });
    }

    const artists = await prisma.profile.findMany({
      where: { labelId: profile.labelId },
      select: { userId: true, name: true, role: true },
    });

    // Join with user emails
    const userIds = artists.map(a => a.userId);
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } });

    const artistsWithEmail = artists.map(a => ({ ...a, email: users.find(u => u.id === a.userId)?.email }));

    return NextResponse.json({ artists: artistsWithEmail });
  } catch (err) {
    console.error('my-artists error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
