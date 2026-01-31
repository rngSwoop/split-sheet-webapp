import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const profile = await prisma.profile.findUnique({ where: { userId: currentUser.id } });
    if (!profile || !profile.labelId) return NextResponse.json({ error: 'Current user has no label' }, { status: 400 });

    // Assign the target user's profile to this label
    const updated = await prisma.profile.update({ where: { userId }, data: { labelId: profile.labelId } });
    return NextResponse.json({ success: true, profile: updated });
  } catch (err) {
    console.error('assign artist error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
