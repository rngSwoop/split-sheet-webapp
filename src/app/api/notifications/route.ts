import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit') || 20), 50);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: currentUser.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          splitSheet: {
            include: {
              song: { select: { finalTitle: true } },
            },
          },
        },
      }),
      prisma.notification.count({
        where: { userId: currentUser.id, read: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error('get notifications error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: currentUser.id, read: false },
        data: { read: true },
      });
    } else if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: currentUser.id,
        },
        data: { read: true },
      });
    } else {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('update notifications error', err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
