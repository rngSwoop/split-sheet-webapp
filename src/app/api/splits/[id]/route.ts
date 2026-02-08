import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createBulkNotifications } from '@/lib/notifications';

interface ContributorInput {
  userId?: string | null;
  legalName: string;
  stageName?: string | null;
  role?: string;
  percentage?: number;
  proAffiliation?: string | null;
  ipiNumber?: string | null;
  publisher?: string | null;
  publisherShare?: number | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  try {
    const split = await prisma.splitSheet.findUnique({
      where: { id },
      include: {
        song: true,
        contributors: true,
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

    // Build permissions object
    const permissions = {
      canEditSongDetails: isCreator || isAdmin,
      canAddRemoveContributors: isCreator || isAdmin,
      editableContributorIds: isAdmin
        ? split.contributors.map((c) => c.id)
        : split.contributors.filter((c) => c.userId === currentUser.id).map((c) => c.id),
    };

    return NextResponse.json({ split, permissions });
  } catch (err) {
    console.error('get split error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
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

    // Capture existing contributor userIds for notification comparison
    const oldUserIds = new Set(
      split.contributors.filter((c) => c.userId).map((c) => c.userId!)
    );

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
          percentage: Number(c.percentage || 0),
          proAffiliation: c.proAffiliation || null,
          ipiNumber: c.ipiNumber || null,
          publisher: c.publisher || null,
          publisherShare: c.publisherShare ?? null,
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('update split error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
