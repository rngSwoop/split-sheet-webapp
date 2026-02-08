import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createBulkNotifications, sendFinalizationNotifications, sendAdminUpdateNotifications } from '@/lib/notifications';

interface ContributorInput {
  userId?: string | null;
  legalName: string;
  stageName?: string | null;
  role?: string;
  contributorType?: string;
  percentage?: number;
  proAffiliation?: string | null;
  proOrgId?: string | null;
  proOtherText?: string | null;
  publisherCompany?: string | null;
  publisherName?: string | null;
  publisherContact?: string | null;
  publisherPhone?: string | null;
  publisherEmail?: string | null;
  publisherId?: string | null;
  publisherShare?: number | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  labelId?: string | null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const split = await prisma.splitSheet.findUnique({
      where: { id },
      include: {
        song: true,
        contributors: {
          include: { publisherEntity: true, proOrg: true, labelEntity: true },
        },
        signatures: true,
      },
    });

    if (!split) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Access check: must be creator, linked contributor, or ADMIN
    const isCreator = split.createdBy === currentUser.id;
    const isContributor = split.contributors.some((c) => c.userId === currentUser.id);
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isCreator && !isContributor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate total percentage for finalization check
    const totalPercentage = split.contributors.reduce((sum, c) => sum + c.percentage, 0);

    // Status-aware edit permissions
    const isReadOnly = split.status === 'SIGNED';
    const editableContributorIds = isReadOnly
      ? []
      : isAdmin
        ? split.contributors.map((c) => c.id)
        : split.contributors.filter((c) => c.userId === currentUser.id).map((c) => c.id);

    // Build permissions object
    const permissions = {
      canEditSongDetails: (isCreator || isAdmin) && !isReadOnly,
      canAddRemoveContributors: (isCreator || isAdmin) && !isReadOnly,
      editableContributorIds,
      canEditPercentage: (isCreator || isAdmin)
        ? !isReadOnly
        : isContributor && split.status === 'DISPUTED',
      canFinalize: (isCreator || isAdmin) && ['PENDING', 'DISPUTED'].includes(split.status) && totalPercentage === 50,
      canDispute: isContributor && !isCreator && ['PENDING', 'SIGNED'].includes(split.status),
      isCreator,
      isAdmin,
      currentUserId: currentUser.id,
    };

    return NextResponse.json({ split, permissions });
  } catch (err) {
    console.error('get split error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json();
    const { finalTitle, workingTitle, iswc, creationDate, agreementDate, clauses, contributors, status } = body;

    // Basic validation
    if (!contributors || !Array.isArray(contributors) || contributors.length === 0) {
      return NextResponse.json({ error: 'Invalid contributors' }, { status: 400 });
    }

    const split = await prisma.splitSheet.findUnique({
      where: { id },
      include: { song: true, contributors: true },
    });
    if (!split) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Creator-only guard (admins can also edit)
    if (split.createdBy !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Writer percentages must sum to 50
    const writerTotal = contributors
      .filter((c: ContributorInput) => !c.contributorType || c.contributorType === 'WRITER')
      .reduce((s: number, c: ContributorInput) => s + Number(c.percentage || 0), 0);
    if (writerTotal !== 50) {
      return NextResponse.json({ error: 'Writer percentages must total 50%' }, { status: 400 });
    }

    // Capture existing contributor userIds for notification comparison
    const oldUserIds = new Set(
      split.contributors.filter((c) => c.userId).map((c) => c.userId!)
    );

    const oldStatus = split.status;

    // Transaction: update song (if exists), update split fields, replace contributors
    await prisma.$transaction([
      ...(split.song
        ? [
            prisma.song.update({
              where: { id: split.song.id },
              data: {
                workingTitle: workingTitle ?? split.song.workingTitle,
                finalTitle: finalTitle ?? split.song.finalTitle,
                iswc: iswc ?? split.song.iswc,
                creationDate: creationDate ? new Date(creationDate) : split.song.creationDate,
              },
            }),
          ]
        : []),
      prisma.splitSheet.update({
        where: { id },
        data: {
          agreementDate: agreementDate ? new Date(agreementDate) : split.agreementDate,
          clauses: clauses ?? split.clauses,
          status: status ?? split.status,
          totalPercentage: contributors.reduce((s: number, c: ContributorInput) => s + Number(c.percentage || 0), 0),
          version: { increment: 1 },
        },
      }),
      // delete existing contributors and recreate
      prisma.contributor.deleteMany({ where: { splitSheetId: id } }),
      prisma.contributor.createMany({
        data: contributors.map((c: ContributorInput) => ({
          splitSheetId: id,
          userId: c.userId || null,
          legalName: c.legalName,
          stageName: c.stageName || null,
          role: c.role || 'Contributor',
          contributorType: (c.contributorType as 'WRITER' | 'PRODUCER') || 'WRITER',
          percentage: Number(c.percentage || 0),
          proAffiliation: c.proAffiliation || null,
          proOrgId: c.proOrgId || null,
          proOtherText: c.proOtherText || null,
          publisherCompany: c.publisherCompany || null,
          publisherName: c.publisherName || null,
          publisherContact: c.publisherContact || null,
          publisherPhone: c.publisherPhone || null,
          publisherEmail: c.publisherEmail || null,
          publisherId: c.publisherId || null,
          publisherShare: c.publisherShare ?? null,
          labelId: c.labelId || null,
          contactEmail: c.contactEmail || null,
          contactPhone: c.contactPhone || null,
          address: c.address || null,
        })),
      }),
    ]);

    // Send notifications for new and existing contributors
    const songTitle = finalTitle || split.song?.finalTitle || 'Untitled';
    const newUserIds = new Set(
      contributors.filter((c: ContributorInput) => c.userId).map((c: ContributorInput) => c.userId as string)
    );

    const notifications: { userId: string; type: 'SPLIT_INVITE' | 'SPLIT_UPDATED'; title: string; message: string; splitSheetId: string }[] = [];

    for (const userId of newUserIds) {
      if (userId === currentUser.id) continue;
      if (oldUserIds.has(userId)) {
        notifications.push({
          userId,
          type: 'SPLIT_UPDATED',
          title: 'Split Sheet Updated',
          message: `The split sheet for "${songTitle}" has been updated`,
          splitSheetId: id,
        });
      } else {
        notifications.push({
          userId,
          type: 'SPLIT_INVITE',
          title: 'Split Sheet Invite',
          message: `You've been added as a contributor to "${songTitle}"`,
          splitSheetId: id,
        });
      }
    }

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }

    // Send finalization notifications if status changed to SIGNED or PUBLISHED
    const newStatus = status ?? split.status;
    if (oldStatus !== newStatus && (newStatus === 'SIGNED' || newStatus === 'PUBLISHED')) {
      const songTitle = finalTitle || split.song?.finalTitle || 'Untitled';
      await sendFinalizationNotifications(id, songTitle, contributors, currentUser.id);
    }

    // Admin update notifications — notify all parties when admin edits
    if (currentUser.role === 'ADMIN') {
      await sendAdminUpdateNotifications(id, songTitle, contributors, currentUser.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('update split error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const split = await prisma.splitSheet.findUnique({
      where: { id },
      include: { song: true, contributors: true, signatures: true },
    });

    if (!split) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isCreator = split.createdBy === currentUser.id;
    const isAdmin = currentUser.role === 'ADMIN';

    // SIGNED splits can only be deleted by admins
    if (split.status === 'SIGNED') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Only admins can delete finalized split sheets' }, { status: 403 });
      }
    } else {
      // Non-SIGNED: creator or admin can delete
      if (!isCreator && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const songId = split.songId;

    // Transaction: delete in FK order
    await prisma.$transaction([
      prisma.signature.deleteMany({ where: { splitSheetId: id } }),
      prisma.notification.deleteMany({ where: { splitSheetId: id } }),
      prisma.auditLog.deleteMany({ where: { splitSheetId: id } }),
      prisma.contributor.deleteMany({ where: { splitSheetId: id } }),
      prisma.splitSheet.delete({ where: { id } }),
    ]);

    // Clean up orphaned song if no other splits reference it
    const remainingSplits = await prisma.splitSheet.count({ where: { songId } });
    if (remainingSplits === 0) {
      await prisma.song.delete({ where: { id: songId } });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('delete split error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
