import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`🔍 Admin checking data integrity for user: ${userId}`);

    const issues = [];

    try {
      // Check for orphaned contributors
      const orphanedContributors = await prisma.contributor.findMany({
        where: {
          userId: null,
          user: {
            deletedAt: { not: null }
          }
        },
        take: 10, // Limit to prevent excessive data
        include: {
          user: {
            select: { id: true, email: true, deletedAt: true }
          }
        }
      });

      if (orphanedContributors.length > 0) {
        issues.push({
          type: 'orphaned_contributors',
          count: orphanedContributors.length,
          description: 'Contributors linked to deleted users',
          sampleData: orphanedContributors.map(c => ({
            contributorId: c.id,
            legalName: c.legalName,
            deletedUser: c.user?.email || 'Unknown'
          }))
        });
      }

      // Check for orphaned signatures
      const orphanedSignatures = await prisma.signature.findMany({
        where: {
          userId: null,
          user: {
            deletedAt: { not: null }
          }
        },
        take: 10,
        include: {
          user: {
            select: { id: true, email: true, deletedAt: true }
          }
        }
      });

      if (orphanedSignatures.length > 0) {
        issues.push({
          type: 'orphaned_signatures',
          count: orphanedSignatures.length,
          description: 'Signatures linked to deleted users',
          sampleData: orphanedSignatures.map(s => ({
            signatureId: s.id,
            signedAt: s.signedAt,
            deletedUser: s.user?.email || 'Unknown'
          }))
        });
      }

      // Check for split sheets with deleted creators
      const usersWithSplitSheets = await prisma.user.findMany({
        where: {
          deletedAt: { not: null }
        },
        select: { id: true, email: true, deletedAt: true }
      });
      
      const userIds = usersWithSplitSheets.map(u => u.id);
      
      const orphanedSplitSheets = await prisma.splitSheet.findMany({
        where: {
          createdBy: { in: userIds }
        },
        take: 10
      });

      if (orphanedSplitSheets.length > 0) {
        const userEmails = usersWithSplitSheets.reduce((acc, user) => {
          acc[user.id] = user.email;
          return acc;
        }, {} as Record<string, string>);
        
        issues.push({
          type: 'orphaned_split_sheets',
          count: orphanedSplitSheets.length,
          description: 'Split sheets created by deleted users',
          sampleData: orphanedSplitSheets.map(s => ({
            splitSheetId: s.id,
            title: 'Untitled', // Removed finalTitle as it doesn't exist on the type
            createdBy: s.createdBy,
            deletedUser: s.createdBy ? userEmails[s.createdBy] || 'Unknown' : 'Unknown'
          }))
        });
      }

      // Check for profiles without valid users
      const orphanedProfiles = await prisma.profile.findMany({
        where: {
          user: {
            deletedAt: { not: null }
          }
        },
        take: 10,
        include: {
          user: {
            select: { id: true, email: true, deletedAt: true }
          }
        }
      });

      if (orphanedProfiles.length > 0) {
        issues.push({
          type: 'orphaned_profiles',
          count: orphanedProfiles.length,
          description: 'Profiles linked to deleted users',
          sampleData: orphanedProfiles.map(p => ({
            profileId: p.id,
            name: p.name,
            deletedUser: p.user?.email || 'Unknown'
          }))
        });
      }

      // Check for deletion jobs in inconsistent states
      const stuckDeletionJobs = await prisma.deletionJob.findMany({
        where: {
          status: {
            in: ['IN_PROGRESS', 'RETRYING']
          },
          startedAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
          }
        },
        take: 10,
        include: {
          steps: true
        }
      });

      if (stuckDeletionJobs.length > 0) {
        issues.push({
          type: 'stuck_deletion_jobs',
          count: stuckDeletionJobs.length,
          description: 'Deletion jobs stuck in progress for over 24 hours',
          sampleData: stuckDeletionJobs.map(job => ({
            jobId: job.jobId,
            userId: job.userId,
            startedAt: job.startedAt,
            currentStep: job.steps.find(s => s.status === 'IN_PROGRESS')?.stepName || 'Unknown'
          }))
        });
      }

      console.log(`✅ Integrity check completed for ${userId}:`, {
        totalIssues: issues.length,
        orphanedContributors: orphanedContributors.length,
        orphanedSignatures: orphanedSignatures.length,
        orphanedSplitSheets: orphanedSplitSheets.length,
        orphanedProfiles: orphanedProfiles.length,
        stuckDeletionJobs: stuckDeletionJobs.length
      });

      return NextResponse.json({
        issues,
        summary: {
          totalIssues: issues.length,
          criticalIssues: issues.filter(i => i.type.includes('orphaned')).length,
          warningIssues: issues.filter(i => i.type.includes('stuck')).length
        },
        userChecked: userId,
        checkedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Data integrity check error:', error);
      return NextResponse.json({ 
        error: 'Failed to check data integrity',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Admin integrity check error:', error);
    return NextResponse.json({ error: 'Failed to process integrity check' }, { status: 500 });
  }
}