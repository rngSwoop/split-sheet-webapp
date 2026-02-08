import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const ALLOWED_FIELDS = [
  'percentage',
  'proAffiliation',
  'ipiNumber',
  'publisher',
  'publisherShare',
  'contactEmail',
  'contactPhone',
  'address',
] as const;

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: splitSheetId } = params;
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

    if (contributor.userId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    }

    return NextResponse.json({ contributor: updated });
  } catch (err) {
    console.error('update contributor error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
