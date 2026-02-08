import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // All users (basic info)
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    // All invites created by this admin
    const invites = await prisma.inviteCode.findMany({
      where: { createdBy: currentUser.id },
      orderBy: { createdAt: 'desc' },
    });

    // If any invites were used, fetch the users who redeemed them
    const usedIds = invites.filter(i => i.usedBy).map(i => i.usedBy as string);
    const usedUsers = usedIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: usedIds } }, select: { id: true, email: true, role: true, name: true } })
      : [];

    // Map used user info into invites
    const invitesWithUsage = invites.map(inv => ({
      ...inv,
      usedByUser: usedUsers.find(u => u.id === inv.usedBy) || null,
    }));

    return NextResponse.json({ users, invites: invitesWithUsage });
  } catch (err) {
    console.error('admin overview error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
