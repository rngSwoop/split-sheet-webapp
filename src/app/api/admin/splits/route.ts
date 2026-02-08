import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (currentUser.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  try {
    const splits = await prisma.splitSheet.findMany({
      where: {
        OR: [
          { createdBy: userId },
          { contributors: { some: { userId } } },
        ],
      },
      include: {
        song: true,
        contributors: { select: { id: true, legalName: true, userId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ splits });
  } catch (err) {
    console.error('admin splits lookup error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
