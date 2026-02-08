import { prisma } from '@/lib/prisma';

type NotificationType = 'SPLIT_INVITE' | 'SPLIT_UPDATED' | 'GENERAL';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  splitSheetId?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        splitSheetId: input.splitSheetId || null,
      },
    });
  } catch (err) {
    console.error('create notification error', err);
  }
}

export async function createBulkNotifications(notifications: CreateNotificationInput[]) {
  if (notifications.length === 0) return;

  try {
    await prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        splitSheetId: n.splitSheetId || null,
      })),
    });
  } catch (err) {
    console.error('create bulk notifications error', err);
  }
}
