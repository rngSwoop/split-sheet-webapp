import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`🔍 Debugging user ${userId}`);

    // Check user in database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check profile
    const profile = await prisma.profile.findFirst({
      where: { userId }
    });

    // Check username availability
    const usernameCheck = user.username ? await prisma.user.findFirst({
      where: { 
        username: user.username,
        deletedAt: null 
      }
    }) : null;

    // Check any existing deletion jobs
    const deletionJobs = await prisma.deletionJob.findMany({
      where: { userId },
      include: {
        steps: true
      }
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        deletedAt: user.deletedAt,
        role: user.role
      },
      profile: profile ? {
        id: profile.id,
        userId: profile.userId,
        deletedAt: profile.deletedAt,
        role: profile.role
      } : null,
      usernameAvailable: !usernameCheck,
      deletionJobs: deletionJobs.map(job => ({
        id: job.id,
        jobId: job.jobId,
        status: job.status,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        failureReason: job.failureReason,
        stepCount: job.steps.length
      }))
    });

  } catch (error) {
    console.error('Debug user error:', error);
    return NextResponse.json({ error: 'Failed to debug user' }, { status: 500 });
  }
}