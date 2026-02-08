import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createBulkNotifications } from '@/lib/notifications';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const mentioned = url.searchParams.get('mentioned');

  try {
    if (mentioned === 'true') {
      // SplitSheets where current user is a contributor
      const splits = await prisma.splitSheet.findMany({
        where: {
          OR: [
            { createdBy: currentUser.id },
            { contributors: { some: { userId: currentUser.id } } },
          ],
        },
        include: { contributors: true, signatures: true },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ splits });
    }

    // Default: return splits created by current user
    const splits = await prisma.splitSheet.findMany({
      where: { createdBy: currentUser.id },
      include: { contributors: true, signatures: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ splits });
  } catch (err) {
    console.error('list splits error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const {
      songId,
      workingTitle,
      finalTitle,
      iswc,
      creationDate,
      agreementDate,
      clauses,
      contributors,
    } = body;

    if (!finalTitle || !contributors || !Array.isArray(contributors) || contributors.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const total = contributors.reduce((s: number, c: any) => s + Number(c.percentage || 0), 0);

    // If songId not provided, create Song record
    let songConnect = undefined;
    if (songId) {
      songConnect = { connect: { id: songId } };
    } else {
      songConnect = {
        create: {
          workingTitle: workingTitle || null,
          finalTitle: finalTitle,
          iswc: iswc || null,
          creationDate: creationDate ? new Date(creationDate) : null,
        },
      };
    }

    const split = await prisma.splitSheet.create({
      data: {
        song: songConnect as any,
        createdBy: currentUser.id,
        version: 1,
        agreementDate: agreementDate ? new Date(agreementDate) : null,
        status: 'DRAFT',
        totalPercentage: total,
        clauses: clauses || '',
        contributors: {
          create: contributors.map((c: any) => ({
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
        },
      },
      include: { contributors: true },
    });

    // Send notifications to linked contributors (not the creator)
    const contributorsToNotify = split.contributors.filter(
      (c) => c.userId && c.userId !== currentUser.id
    );
    if (contributorsToNotify.length > 0) {
      await createBulkNotifications(
        contributorsToNotify.map((c) => ({
          userId: c.userId!,
          type: 'SPLIT_INVITE' as const,
          title: 'Split Sheet Invite',
          message: `You've been added as a contributor to "${finalTitle}"`,
          splitSheetId: split.id,
        }))
      );
    }

    return NextResponse.json({ split });
  } catch (err) {
    console.error('create split error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
