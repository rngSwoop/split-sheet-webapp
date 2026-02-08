import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, includeAuth = false, includeIntegrity = false } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`🔍 Admin investigating user: ${userId}`);

    // Get comprehensive user data
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get profile data
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

    // Get deletion history
    const deletionJobs = await prisma.deletionJob.findMany({
      where: { userId },
      include: {
        steps: true
      },
      orderBy: { startedAt: 'desc' }
    });

    // Build response
    const investigationData = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        deletedAt: user.deletedAt,
        anonymizedName: user.anonymizedName,
        deletedReason: user.deletedReason,
        dataRetentionUntil: user.dataRetentionUntil,
        deletionRequestOrigin: user.deletionRequestOrigin
      },
      profile: profile ? {
        id: profile.id,
        userId: profile.userId,
        deletedAt: profile.deletedAt,
        role: profile.role,
        name: profile.name
      } : null,
      usernameAvailable: !usernameCheck,
      deletionJobs: deletionJobs.map(job => ({
        id: job.id,
        jobId: job.jobId,
        status: job.status,
        startedAt: job.startedAt.toISOString(),
        completedAt: job.completedAt?.toISOString() || null,
        failureReason: job.failureReason,
        stepCount: job.steps.length
      }))
    };

    // Add auth status if requested
    if (includeAuth) {
      try {
        const authUser = await supabaseAdmin.auth.admin.getUserById(userId);
        investigationData.authStatus = {
          existsInAuth: !authUser.error,
          createdAt: authUser.data?.user?.created_at,
          lastSignIn: authUser.data?.user?.last_sign_in_at
        };
        console.log(`🔐 Auth status for ${userId}:`, {
          exists: investigationData.authStatus.existsInAuth,
          createdAt: investigationData.authStatus.createdAt,
          lastSignIn: investigationData.authStatus.lastSignIn
        });
      } catch (authError) {
        console.error(`❌ Auth check failed for ${userId}:`, authError);
        investigationData.authStatus = {
          existsInAuth: false,
          error: authError instanceof Error ? authError.message : 'Unknown auth error'
        };
      }
    }

    // Add integrity check if requested
    if (includeIntegrity) {
      try {
        const integrityIssues = [];

        // Check for orphaned contributors
        const orphanedContributors = await prisma.contributor.count({
          where: {
            userId: null,
            user: {
              deletedAt: { not: null }
            }
          }
        });

        if (orphanedContributors > 0) {
          integrityIssues.push({
            type: 'orphaned_contributors',
            count: orphanedContributors,
            description: 'Contributors linked to deleted users'
          });
        }

        // Check for orphaned signatures
        const orphanedSignatures = await prisma.signature.count({
          where: {
            userId: null,
            user: {
              deletedAt: { not: null }
            }
          }
        });

        if (orphanedSignatures > 0) {
          integrityIssues.push({
            type: 'orphaned_signatures',
            count: orphanedSignatures,
            description: 'Signatures linked to deleted users'
          });
        }

        investigationData.integrityIssues = integrityIssues;
        console.log(`🔍 Integrity check for ${userId}:`, {
          orphanedContributors,
          orphanedSignatures,
          totalIssues: integrityIssues.length
        });
      } catch (integrityError) {
        console.error(`❌ Integrity check failed for ${userId}:`, integrityError);
        investigationData.integrityIssues = [{
          type: 'integrity_check_failed',
          count: 1,
          description: 'Failed to complete integrity check'
        }];
      }
    }

    console.log(`✅ Investigation completed for ${userId}`);

    return NextResponse.json(investigationData);

  } catch (error) {
    console.error('User investigation error:', error);
    return NextResponse.json({ error: 'Failed to investigate user' }, { status: 500 });
  }
}