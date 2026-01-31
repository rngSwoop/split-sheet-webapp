import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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

    // Update song if needed
    const split = await prisma.splitSheet.findUnique({ where: { id }, include: { song: true } });
    if (!split) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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
          totalPercentage: contributors.reduce((s: number, c: any) => s + Number(c.percentage || 0), 0),
        },
      }),
      // delete existing contributors and recreate
      prisma.contributor.deleteMany({ where: { splitSheetId: id } }),
      prisma.contributor.createMany({
        data: contributors.map((c: any) => ({
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('update split error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
