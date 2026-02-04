import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDashboardRoute } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json({ error: 'Missing userId or code' }, { status: 400 });
    }

    // Find the invite code
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
    }

    if (inviteCode.usedAt) {
      return NextResponse.json({ error: 'Invite code has already been used' }, { status: 400 });
    }

    if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
      return NextResponse.json({ error: 'Invite code has expired' }, { status: 400 });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only allow upgrading from ARTIST role
    if (user.role !== 'ARTIST') {
      return NextResponse.json({ error: 'You can only upgrade from Artist role' }, { status: 400 });
    }

    // Update user role
    await prisma.user.update({
      where: { id: userId },
      data: { role: inviteCode.role },
    });

    // Mark invite code as used
    await prisma.inviteCode.update({
      where: { id: inviteCode.id },
      data: {
        usedAt: new Date(),
        usedBy: userId,
      },
    });

    // Determine redirect URL based on new role
    const redirectUrl = getDashboardRoute(inviteCode.role);

    return NextResponse.json({
      success: true,
      newRole: inviteCode.role,
      redirectUrl,
    });

  } catch (error) {
    console.error('Role upgrade error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}