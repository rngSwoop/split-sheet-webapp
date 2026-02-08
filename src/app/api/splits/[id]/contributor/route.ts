import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

const ALLOWED_FIELDS = [
  'percentage',
  'proAffiliation',
  'proOrgId',
  'proOtherText',
  'publisherId',
  'publisherCompany',
  'publisherName',
  'publisherContact',
  'publisherPhone',
  'publisherEmail',
  'publisherShare',
  'labelId',
  'contactEmail',
  'contactPhone',
  'address',
] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: splitSheetId } = await params;
  try {
    const body = await request.json();
    const { contributorId, ...fields } = body;

    if (!contributorId) {
      return NextResponse.json({ error: 'contributorId is required' }, { status: 400 });
    }

    // Verify the contributor exists, belongs to this split, and is owned by the current user
    const contributor = await prisma.contributor.findUnique({
      where: { id: contributorId },
    });

    if (!contributor) {
      return NextResponse.json({ error: 'Contributor not found' }, { status: 404 });
    }

    if (contributor.splitSheetId !== splitSheetId) {
      return NextResponse.json({ error: 'Contributor does not belong to this split sheet' }, { status: 400 });
    }

    if (contributor.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Look up the split to check status for percentage-change rules
    const splitSheet = await prisma.splitSheet.findUnique({
      where: { id: splitSheetId },
      include: { song: true },
    });
    if (!splitSheet) {
      return NextResponse.json({ error: 'Split sheet not found' }, { status: 404 });
    }

    const isCreator = splitSheet.createdBy === currentUser.id;
    const isAdmin = currentUser.role === 'ADMIN';

    // Non-creator/non-admin can only change percentage when status is DISPUTED
    if ('percentage' in fields && !isCreator && !isAdmin && splitSheet.status !== 'DISPUTED') {
      return NextResponse.json(
        { error: 'You must dispute the split sheet before changing your percentage' },
        { status: 403 }
      );
    }

    // Filter to only allowed fields
    const updateData: Record<string, unknown> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in fields) {
        updateData[field] = fields[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const oldPercentage = contributor.percentage;

    // Update the contributor
    const updated = await prisma.contributor.update({
      where: { id: contributorId },
      data: updateData,
    });

    // Recalculate totalPercentage if percentage changed
    if ('percentage' in updateData) {
      const allContributors = await prisma.contributor.findMany({
        where: { splitSheetId },
        select: { percentage: true },
      });
      const totalPercentage = allContributors.reduce((sum, c) => sum + c.percentage, 0);
      await prisma.splitSheet.update({
        where: { id: splitSheetId },
        data: { totalPercentage },
      });

      const newPercentage = Number(updateData.percentage);
      const songTitle = splitSheet.song?.finalTitle || 'Untitled';

      // If a non-creator changed their percentage during dispute, notify the creator
      if (!isCreator && !isAdmin && oldPercentage !== newPercentage && splitSheet.createdBy) {
        const contributorName = contributor.stageName || contributor.legalName || 'A contributor';
        await createNotification({
          userId: splitSheet.createdBy,
          type: 'SPLIT_DISPUTED' as any,
          title: 'Split Percentage Changed',
          message: `${contributorName} changed their split % from ${oldPercentage}% to ${newPercentage}% on "${songTitle}"`,
          splitSheetId,
        });
      }

      // Send "ready to finalize" notification if total hits 50% and status is PENDING or DISPUTED
      if (totalPercentage === 50 && ['PENDING', 'DISPUTED'].includes(splitSheet.status) && splitSheet.createdBy) {
        await createNotification({
          userId: splitSheet.createdBy,
          type: 'SPLIT_READY',
          title: 'Split Sheet Ready to Finalize',
          message: `All writer splits for "${songTitle}" total 50%. Ready to finalize.`,
          splitSheetId,
        });
      }
    }

    return NextResponse.json({ contributor: updated });
  } catch (err) {
    console.error('update contributor error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
