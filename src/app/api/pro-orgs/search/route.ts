import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim();

  if (!q) {
    return NextResponse.json({ proOrgs: [] });
  }

  try {
    const proOrgs = await prisma.performanceRightsOrg.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
      },
      select: { id: true, name: true },
      take: 20,
    });

    return NextResponse.json({ proOrgs });
  } catch (err) {
    console.error('pro org search error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
