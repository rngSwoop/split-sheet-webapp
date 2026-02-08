import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1); // 1 year ago
    
    const inactiveUsers = await prisma.user.findMany({
      where: {
        deletedAt: null,
        lastActiveAt: { 
          lt: cutoffDate 
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        lastActiveAt: true,
        createdAt: true
      }
    });

    // Also check for users approaching inactivity (6 month warning)
    const sixMonthWarningDate = new Date();
    sixMonthWarningDate.setMonth(sixMonthWarningDate.getMonth() - 6);
    
    const approachingInactiveUsers = await prisma.user.findMany({
      where: {
        deletedAt: null,
        lastActiveAt: { 
          lt: sixMonthWarningDate,
          gte: cutoffDate 
        }
      },
      select: {
        id: true,
        email: true,
        lastActiveAt: true
      }
    });

    return NextResponse.json({ 
      inactiveUsers,
      approachingInactiveUsers,
      totalInactive: inactiveUsers.length,
      totalApproachingInactive: approachingInactiveUsers.length,
      cutoffDate: cutoffDate.toISOString(),
      sixMonthWarningDate: sixMonthWarningDate.toISOString(),
      reportGeneratedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Inactivity check error:', error);
    return NextResponse.json({ error: 'Failed to check user inactivity' }, { status: 500 });
  }
}