// src/app/api/invite/validate-and-upgrade/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code: rawCode, requestedRole: rawRequestedRole } = await request.json();
  const code = String(rawCode || '').trim().toUpperCase();
  const requestedRole = String(rawRequestedRole || '').toUpperCase();

  const invite = await prisma.inviteCode.findUnique({
    where: { code },
  });

  if (!invite || invite.usedAt || (invite.expiresAt !== null && invite.expiresAt < new Date()) || invite.role !== requestedRole) {
    return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 400 });
  }
  // Perform a transaction: update both Profile and User roles, and mark invite used
  try {
    await prisma.$transaction([
      prisma.profile.update({
        where: { userId: currentUser.id },
        data: { role: requestedRole },
      }),
      prisma.user.update({
        where: { id: currentUser.id },
        data: { role: requestedRole },
      }),
      prisma.inviteCode.update({
        where: { code },
        data: { usedBy: currentUser.id, usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true, role: requestedRole });
  } catch (err) {
    console.error('redeem invite transaction failed', err);
    return NextResponse.json({ error: 'Failed to redeem invite' }, { status: 500 });
  }
}