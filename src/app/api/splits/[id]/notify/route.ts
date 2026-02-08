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
      include: {
        song: true,
        contributors: true,
      },
    });

    if (!split) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isCreator = split.createdBy === currentUser.id;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Only the creator or an admin can send notifications' }, { status: 403 });
    }

    if (split.status === 'SIGNED') {
      return NextResponse.json({ error: 'Cannot notify on finalized split sheets' }, { status: 400 });
    }

    const songTitle = split.song.finalTitle || 'Untitled';
    const userIdsToNotify = new Set<string>();

    // Collect all linked contributor users (excluding current user)
    for (const c of split.contributors) {
      if (c.userId && c.userId !== currentUser.id) {
        userIdsToNotify.add(c.userId);
      }
    }

    // Collect publisher staff
    const publisherIds = split.contributors
      .map((c) => c.publisherId)
      .filter((id): id is string => !!id);
    if (publisherIds.length > 0) {
      const publisherProfiles = await prisma.profile.findMany({
        where: { publisherId: { in: publisherIds } },
        select: { userId: true },
      });
      for (const p of publisherProfiles) {
        if (p.userId !== currentUser.id) userIdsToNotify.add(p.userId);
      }
    }

    // Collect PRO staff
    const proOrgIds = split.contributors
      .map((c) => c.proOrgId)
      .filter((id): id is string => !!id);
    if (proOrgIds.length > 0) {
      const proProfiles = await prisma.profile.findMany({
        where: { proOrgId: { in: proOrgIds } },
        select: { userId: true },
      });
      for (const p of proProfiles) {
        if (p.userId !== currentUser.id) userIdsToNotify.add(p.userId);
      }
    }

    // Collect label staff
    const labelIds = split.contributors
      .map((c) => c.labelId)
      .filter((id): id is string => !!id);
    if (labelIds.length > 0) {
      const labelProfiles = await prisma.profile.findMany({
        where: { labelId: { in: labelIds } },
        select: { userId: true },
      });
      for (const p of labelProfiles) {
        if (p.userId !== currentUser.id) userIdsToNotify.add(p.userId);
      }
    }

    if (userIdsToNotify.size === 0) {
      return NextResponse.json({ success: true, notified: 0 });
    }

    await createBulkNotifications(
      Array.from(userIdsToNotify).map((userId) => ({
        userId,
        type: 'SPLIT_UPDATED' as const,
        title: 'Split Sheet Update',
        message: `The split sheet for "${songTitle}" has been updated — please review your contributions`,
        splitSheetId: id,
      }))
    );

    return NextResponse.json({ success: true, notified: userIdsToNotify.size });
  } catch (err) {
    console.error('notify split error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
