import { prisma } from '@/lib/prisma';

type NotificationType = 'SPLIT_INVITE' | 'SPLIT_UPDATED' | 'SPLIT_FINALIZED' | 'SPLIT_DISPUTED' | 'SPLIT_READY' | 'GENERAL';

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

interface ContributorNotifyInput {
  userId?: string | null;
  publisherId?: string | null;
  proOrgId?: string | null;
  labelId?: string | null;
}

export async function sendFinalizationNotifications(
  splitSheetId: string,
  songTitle: string,
  contributors: ContributorNotifyInput[],
  creatorId: string
) {
  try {
    const userIdsToNotify = new Set<string>();

    // Notify all linked contributor users (excluding creator)
    for (const c of contributors) {
      if (c.userId && c.userId !== creatorId) {
        userIdsToNotify.add(c.userId);
      }
    }

    // Notify publisher staff — profiles linked to contributor publishers
    const publisherIds = contributors
      .map((c) => c.publisherId)
      .filter((id): id is string => !!id);
    if (publisherIds.length > 0) {
      const publisherProfiles = await prisma.profile.findMany({
        where: { publisherId: { in: publisherIds } },
        select: { userId: true },
      });
      for (const p of publisherProfiles) {
        if (p.userId !== creatorId) userIdsToNotify.add(p.userId);
      }
    }

    // Notify PRO staff — profiles linked to contributor PRO orgs
    const proOrgIds = contributors
      .map((c) => c.proOrgId)
      .filter((id): id is string => !!id);
    if (proOrgIds.length > 0) {
      const proProfiles = await prisma.profile.findMany({
        where: { proOrgId: { in: proOrgIds } },
        select: { userId: true },
      });
      for (const p of proProfiles) {
        if (p.userId !== creatorId) userIdsToNotify.add(p.userId);
      }
    }

    // Notify label staff — profiles linked to contributor labels
    const labelIds = contributors
      .map((c) => c.labelId)
      .filter((id): id is string => !!id);
    if (labelIds.length > 0) {
      const labelProfiles = await prisma.profile.findMany({
        where: { labelId: { in: labelIds } },
        select: { userId: true },
      });
      for (const p of labelProfiles) {
        if (p.userId !== creatorId) userIdsToNotify.add(p.userId);
      }
    }

    if (userIdsToNotify.size === 0) return;

    await createBulkNotifications(
      Array.from(userIdsToNotify).map((userId) => ({
        userId,
        type: 'SPLIT_FINALIZED' as const,
        title: 'Split Sheet Finalized',
        message: `The split sheet for "${songTitle}" has been finalized`,
        splitSheetId,
      }))
    );
  } catch (err) {
    console.error('send finalization notifications error', err);
  }
}

export async function sendAdminUpdateNotifications(
  splitSheetId: string,
  songTitle: string,
  contributors: ContributorNotifyInput[],
  adminUserId: string
) {
  try {
    const userIdsToNotify = new Set<string>();

    // Notify all linked contributor users (excluding admin)
    for (const c of contributors) {
      if (c.userId && c.userId !== adminUserId) {
        userIdsToNotify.add(c.userId);
      }
    }

    // Notify publisher staff
    const publisherIds = contributors
      .map((c) => c.publisherId)
      .filter((id): id is string => !!id);
    if (publisherIds.length > 0) {
      const publisherProfiles = await prisma.profile.findMany({
        where: { publisherId: { in: publisherIds } },
        select: { userId: true },
      });
      for (const p of publisherProfiles) {
        if (p.userId !== adminUserId) userIdsToNotify.add(p.userId);
      }
    }

    // Notify PRO staff
    const proOrgIds = contributors
      .map((c) => c.proOrgId)
      .filter((id): id is string => !!id);
    if (proOrgIds.length > 0) {
      const proProfiles = await prisma.profile.findMany({
        where: { proOrgId: { in: proOrgIds } },
        select: { userId: true },
      });
      for (const p of proProfiles) {
        if (p.userId !== adminUserId) userIdsToNotify.add(p.userId);
      }
    }

    // Notify label staff
    const labelIds = contributors
      .map((c) => c.labelId)
      .filter((id): id is string => !!id);
    if (labelIds.length > 0) {
      const labelProfiles = await prisma.profile.findMany({
        where: { labelId: { in: labelIds } },
        select: { userId: true },
      });
      for (const p of labelProfiles) {
        if (p.userId !== adminUserId) userIdsToNotify.add(p.userId);
      }
    }

    if (userIdsToNotify.size === 0) return;

    await createBulkNotifications(
      Array.from(userIdsToNotify).map((userId) => ({
        userId,
        type: 'SPLIT_UPDATED' as const,
        title: 'Split Sheet Updated by Admin',
        message: `An admin has updated the split sheet for "${songTitle}"`,
        splitSheetId,
      }))
    );
  } catch (err) {
    console.error('send admin update notifications error', err);
  }
}
