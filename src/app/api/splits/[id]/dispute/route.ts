import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createBulkNotifications } from '@/lib/notifications';

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

    // Must be a linked contributor (not the creator)
    const isCreator = split.createdBy === currentUser.id;
    const isContributor = split.contributors.some((c) => c.userId === currentUser.id);

    if (!isContributor || isCreator) {
      return NextResponse.json({ error: 'Only non-creator contributors can dispute' }, { status: 403 });
    }

    // Must be PENDING or SIGNED
    if (!['PENDING', 'SIGNED'].includes(split.status)) {
      return NextResponse.json({ error: 'Only pending or finalized split sheets can be disputed' }, { status: 400 });
    }

    // Update status to DISPUTED
    const updated = await prisma.splitSheet.update({
      where: { id },
      data: { status: 'DISPUTED', disputedBy: currentUser.id, version: { increment: 1 } },
      include: { song: true, contributors: true },
    });

    // Get the disputing contributor's name
    const disputingContributor = split.contributors.find((c) => c.userId === currentUser.id);
    const disputerName = disputingContributor?.stageName || disputingContributor?.legalName || 'A contributor';
    const songTitle = split.song?.finalTitle || 'Untitled';

    // Notify all linked contributors + creator
    const userIdsToNotify = new Set<string>();
    if (split.createdBy) userIdsToNotify.add(split.createdBy);
    for (const c of split.contributors) {
      if (c.userId && c.userId !== currentUser.id) {
        userIdsToNotify.add(c.userId);
      }
    }

    if (userIdsToNotify.size > 0) {
      await createBulkNotifications(
        Array.from(userIdsToNotify).map((userId) => ({
          userId,
          type: 'SPLIT_DISPUTED' as const,
          title: 'Split Sheet Disputed',
          message: `${disputerName} is requesting changes to the split sheet for "${songTitle}"`,
          splitSheetId: id,
        }))
      );
    }

    return NextResponse.json({ split: updated });
  } catch (err) {
    console.error('dispute split error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
