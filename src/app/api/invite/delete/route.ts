import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inviteId } = await request.json();
    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID is required' }, { status: 400 });
    }

    const invite = await prisma.inviteCode.findUnique({ where: { id: inviteId } });
    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }
    if (invite.createdBy !== currentUser.id) {
      return NextResponse.json({ error: 'You can only delete invites you created' }, { status: 403 });
    }

    if (invite.usedBy) {
      // Revert user role + delete invite atomically
      await prisma.$transaction([
        prisma.user.update({
          where: { id: invite.usedBy },
          data: { role: 'ARTIST' },
        }),
        prisma.profile.updateMany({
          where: { userId: invite.usedBy },
          data: { role: 'ARTIST' },
        }),
        prisma.inviteCode.delete({ where: { id: inviteId } }),
      ]);

      return NextResponse.json({ success: true, wasUsed: true, revertedUser: invite.usedBy });
    }

    // Unused — just delete
    await prisma.inviteCode.delete({ where: { id: inviteId } });
    return NextResponse.json({ success: true, wasUsed: false });

  } catch (error) {
    console.error('Delete invite error:', error);
    return NextResponse.json({ error: 'Failed to delete invite' }, { status: 500 });
  }
}
