import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 });
    }

    console.log(`🧹 Admin cleanup requested: ${action} for user: ${userId}`);

    let result;
    
    switch (action) {
      case 'delete-auth-user':
        try {
          // Force delete user from Supabase auth
          const authResult = await supabaseAdmin.auth.admin.deleteUser(userId);
          
          if (authResult.error) {
            throw new Error(`Failed to delete auth user: ${authResult.error.message}`);
          }

          result = {
            success: true,
            action: 'delete-auth-user',
            message: 'Auth user successfully deleted from Supabase',
            userId
          };

          console.log(`✅ Auth user deleted: ${userId}`);
        } catch (authError) {
          result = {
            success: false,
            action: 'delete-auth-user',
            error: authError instanceof Error ? authError.message : 'Unknown auth deletion error',
            userId
          };
          console.error(`❌ Auth deletion failed: ${authError}`);
        }
        break;

      case 'cleanup-orphaned':
        try {
          // Cleanup orphaned contributors
          const contributorResult = await prisma.contributor.deleteMany({
            where: {
              userId: null,
              user: {
                deletedAt: { not: null }
              }
            }
          });

          // Cleanup orphaned signatures  
          const signatureResult = await prisma.signature.deleteMany({
            where: {
              userId: null,
              user: {
                deletedAt: { not: null }
              }
            }
          });

          // Cleanup orphaned profiles
          const profileResult = await prisma.profile.deleteMany({
            where: {
              user: {
                deletedAt: { not: null }
              }
            }
          });

          result = {
            success: true,
            action: 'cleanup-orphaned',
            message: 'Orphaned data cleaned up successfully',
            cleanup: {
              contributorsDeleted: contributorResult.count,
              signaturesDeleted: signatureResult.count,
              profilesDeleted: profileResult.count
            }
          };

          console.log(`✅ Orphaned cleanup completed:`, {
            contributors: contributorResult.count,
            signatures: signatureResult.count,
            profiles: profileResult.count
          });
        } catch (cleanupError) {
          result = {
            success: false,
            action: 'cleanup-orphaned',
            error: cleanupError instanceof Error ? cleanupError.message : 'Unknown cleanup error',
            userId
          };
          console.error(`❌ Orphaned cleanup failed: ${cleanupError}`);
        }
        break;

      case 'complete-stuck-job':
        try {
          // Mark stuck deletion jobs as needs manual review
          const jobResult = await prisma.deletionJob.updateMany({
            where: {
              status: {
                in: ['IN_PROGRESS', 'RETRYING']
              },
              startedAt: {
                lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            },
            data: {
              status: 'NEEDS_MANUAL_REVIEW',
              failureReason: 'Manually marked as stuck by admin'
            }
          });

          result = {
            success: true,
            action: 'complete-stuck-job',
            message: `${jobResult.count} stuck deletion jobs marked for manual review`,
            jobsUpdated: jobResult.count
          };

          console.log(`✅ Stuck jobs completed: ${jobResult.count}`);
        } catch (jobError) {
          result = {
            success: false,
            action: 'complete-stuck-job',
            error: jobError instanceof Error ? jobError.message : 'Unknown job error',
            userId
          };
          console.error(`❌ Job completion failed: ${jobError}`);
        }
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid cleanup action',
          validActions: ['delete-auth-user', 'cleanup-orphaned', 'complete-stuck-job']
        }, { status: 400 });
    }

    // Log the cleanup action
    // Get any existing split sheet to use as placeholder for system-level logs
    const anySplitSheet = await prisma.splitSheet.findFirst();
    const splitSheetId = anySplitSheet?.id;

    // Build audit log data with optional splitSheetId
    const auditLogData: {
      action: string;
      performedBy: string;
      reason: string;
      timestamp: Date;
      oldValue: string;
      newValue: string;
      splitSheetId?: string;
    } = {
      action: 'ADMIN_INVESTIGATION_CLEANUP',
      performedBy: currentUser.id,
      reason: `Admin performed cleanup action: ${action}`,
      timestamp: new Date(),
      oldValue: JSON.stringify({ userId, action }),
      newValue: JSON.stringify(result)
    };

    // Only add splitSheetId if it exists
    if (splitSheetId) {
      auditLogData.splitSheetId = splitSheetId;
    }

    await prisma.auditLog.create({ data: auditLogData });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Admin cleanup error:', error);
    return NextResponse.json({ 
      error: 'Failed to perform cleanup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}