import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const proOrgs = await prisma.performanceRightsOrg.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ proOrgs });
  } catch (err) {
    console.error('list pro orgs error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
