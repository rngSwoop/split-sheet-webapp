import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendFinalizationNotifications } from '@/lib/notifications';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const split = await prisma.splitSheet.findUnique({
      where: { id },
      include: { song: true, contributors: true },
    });

    if (!split) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Only creator or admin can finalize
    const isCreator = split.createdBy === currentUser.id;
    const isAdmin = currentUser.role === 'ADMIN';
    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Must be PENDING or DISPUTED
    if (!['PENDING', 'DISPUTED'].includes(split.status)) {
      return NextResponse.json({ error: 'Split sheet cannot be finalized in its current status' }, { status: 400 });
    }

    // Verify total percentage equals 50
    const totalPercentage = split.contributors.reduce((sum, c) => sum + c.percentage, 0);
    if (totalPercentage !== 50) {
      return NextResponse.json({ error: 'Writer percentages must total 50% before finalizing' }, { status: 400 });
    }

    // Update status to SIGNED, clear disputedBy
    const updated = await prisma.splitSheet.update({
      where: { id },
      data: { status: 'SIGNED', disputedBy: null },
      include: { song: true, contributors: true },
    });

    // Send finalization notifications
    const songTitle = split.song?.finalTitle || 'Untitled';
    await sendFinalizationNotifications(id, songTitle, split.contributors, currentUser.id);

    return NextResponse.json({ split: updated });
  } catch (err) {
    console.error('finalize split error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
