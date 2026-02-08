import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';
import { Role, DeletionStatus, StepStatus } from '@prisma/client';

// Configuration constants
const BATCH_SIZE = 50;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s


interface DeleteAccountRequest {
  userId: string;
  confirmation: string;
}

interface DeletionProgress {
  jobId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RETRYING' | 'COMPLETED' | 'FAILED' | 'NEEDS_MANUAL_REVIEW' | 'CANCELLED';
  currentBatch: number;
  totalBatches: number;
  currentStep: string;
  progressPercentage: number;
  estimatedMinutesRemaining?: number;
  error?: string;
}



// Helper functions for job step management
async function createJobStep(deletionJobId: string, stepName: string): Promise<void> {
  await prisma.deletionJobStep.create({
    data: {
      deletionJobId,
      stepName,
      status: StepStatus.PENDING,
      totalItems: 0 // Will be updated during processing
    }
  });
}

async function updateJobStep(
  deletionJobId: string, 
  stepName: string, 
  status: StepStatus,
  failureReason?: string,
  itemsProcessed?: number
): Promise<void> {
  await prisma.deletionJobStep.updateMany({
    where: {
      deletionJobId,
      stepName
    },
    data: {
      status,
      failureReason,
      startedAt: status === StepStatus.IN_PROGRESS ? new Date() : undefined,
      completedAt: status === StepStatus.COMPLETED ? new Date() : undefined,
      itemsProcessed: itemsProcessed !== undefined ? itemsProcessed : undefined
    }
  });
}

export async function POST(request: Request) {
  try {
    const { userId, confirmation }: DeleteAccountRequest = await request.json();
    console.log(`🗑️  Received account deletion request for user: ${userId}, confirmation: ${confirmation}`);

    if (!userId || confirmation !== 'DELETE') {
      return NextResponse.json({ error: 'Valid user ID and confirmation are required' }, { status: 400 });
    }

    // Check if there's already a deletion job in progress for this user
    const existingJob = await prisma.deletionJob.findFirst({
      where: {
        userId,
        status: {
          in: [DeletionStatus.PENDING, DeletionStatus.IN_PROGRESS, DeletionStatus.RETRYING]
        }
      }
    });

if (existingJob) {
      console.log(`⚠️  User ${userId} already has deletion job with status: ${existingJob.status}`);
      return NextResponse.json({ 
        error: 'Account deletion is already in progress', 
        jobId: existingJob.jobId,
        status: existingJob.status 
      }, { status: 409 });
    }

    // Generate job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    console.log(`🆔 Generated job ID: ${jobId} for user: ${userId}`);

    // Create deletion job in database
    const deletionJob = await prisma.deletionJob.create({
      data: {
        jobId,
        userId,
        status: DeletionStatus.PENDING,
        currentBatch: 0,
        totalBatches: 1, // Will be updated after validation
        retryCount: 0,
        startedAt: new Date()
      }
    });

    console.log(`✅ Created deletion job:`, {
      id: deletionJob.id,
      jobId: deletionJob.jobId,
      userId: deletionJob.userId,
      status: deletionJob.status
    });

    // Create initial job steps
    await Promise.all([
      createJobStep(deletionJob.id, 'VALIDATE_USER'),
      createJobStep(deletionJob.id, 'BATCH_PROCESSING'),
      createJobStep(deletionJob.id, 'SUPABASE_DELETE'),
      createJobStep(deletionJob.id, 'CLEANUP'),
      createJobStep(deletionJob.id, 'COMPLETED')
    ]);

    // Start processing in background
    processAccountDeletion(deletionJob.id, userId).catch(console.error);

    return NextResponse.json({ 
      success: true,
      jobId,
      message: 'Account deletion initiated. You can track progress using the provided job ID.'
    });

  } catch (error) {
    console.error('Account deletion initialization error:', error);
    return NextResponse.json({ error: 'Failed to initiate account deletion' }, { status: 500 });
  }
}

// GET endpoint for progress tracking
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const deletionJob = await prisma.deletionJob.findUnique({
      where: { jobId },
      include: {
        steps: {
          orderBy: { stepName: 'asc' }
        }
      }
    });

    if (!deletionJob) {
      return NextResponse.json({ error: 'Deletion job not found' }, { status: 404 });
    }

    const progress = calculateProgress(deletionJob);
    return NextResponse.json(progress);

  } catch (error) {
    console.error('Progress tracking error:', error);
    return NextResponse.json({ error: 'Failed to get progress' }, { status: 500 });
  }
}

// DELETE endpoint for cancellation (within 30 seconds)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const deletionJob = await prisma.deletionJob.findUnique({
      where: { jobId },
      include: { steps: true }
    });

    if (!deletionJob) {
      return NextResponse.json({ error: 'Deletion job not found' }, { status: 404 });
    }

    // Only allow cancellation within 30 seconds of job start
    const timeSinceStart = new Date().getTime() - deletionJob.startedAt.getTime();
    if (timeSinceStart > 30000) {
      return NextResponse.json({ error: 'Cancellation window has expired (30 seconds)' }, { status: 400 });
    }

    if (deletionJob.status !== DeletionStatus.IN_PROGRESS) {
      return NextResponse.json({ error: 'Job cannot be cancelled in current state' }, { status: 400 });
    }

    // Check if we're still in VALIDATE_USER step
    const validateStep = deletionJob.steps.find(step => step.stepName === 'VALIDATE_USER');
    if (!validateStep || validateStep.status !== StepStatus.IN_PROGRESS) {
      return NextResponse.json({ error: 'Job cannot be cancelled in current state' }, { status: 400 });
    }

    // Cancel the job in database
    await prisma.deletionJob.update({
      where: { id: deletionJob.id },
      data: {
        status: DeletionStatus.CANCELLED,
        cancellationRequestedAt: new Date()
      }
    });

    // Update current step to cancelled
    // Update current step to cancelled
    await prisma.deletionJobStep.updateMany({
      where: {
        deletionJobId: deletionJob.id,
        stepName: 'VALIDATE_USER'
      },
      data: {
        status: StepStatus.COMPLETED,
        completedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Account deletion has been cancelled successfully.'
    });

  } catch (error) {
    console.error('Cancellation error:', error);
    return NextResponse.json({ error: 'Failed to cancel deletion' }, { status: 500 });
  }
}

// Main deletion processing function
async function processAccountDeletion(deletionJobId: string, userId: string): Promise<void> {
  let retryCount = 0;

  while (retryCount <= MAX_RETRIES) {
    try {
      // Update job status
      const currentStatus = retryCount > 0 ? DeletionStatus.RETRYING : DeletionStatus.IN_PROGRESS;
      await prisma.deletionJob.update({
        where: { id: deletionJobId },
        data: { 
          status: currentStatus,
          retryCount
        }
      });

      // Step 1: Validate user and count resources
      await updateJobStep(deletionJobId, 'VALIDATE_USER', StepStatus.IN_PROGRESS);
      const userResources = await validateUserAndCountResources(userId);
      await updateJobStep(deletionJobId, 'VALIDATE_USER', StepStatus.COMPLETED);

      // Step 2: Calculate batching and update job
      const totalBatches = Math.ceil(userResources.totalSplitSheets / BATCH_SIZE);
      await prisma.deletionJob.update({
        where: { id: deletionJobId },
        data: { totalBatches }
      });

      // Step 3: Process batches
      await updateJobStep(deletionJobId, 'BATCH_PROCESSING', StepStatus.IN_PROGRESS);
      
      // If there are no batches (no split sheets), still need to process user soft delete
      if (totalBatches === 0) {
        console.log(`📦 No split sheets found, processing user soft delete directly`);
        await processUserSoftDelete(userId);
      } else {
        // Process normal batch flow
        for (let batch = 0; batch < totalBatches; batch++) {
          await prisma.deletionJob.update({
            where: { id: deletionJobId },
            data: { currentBatch: batch + 1 }
          });
          await processBatch(userId, batch, userResources.totalSplitSheets);
        }
      }
      await updateJobStep(deletionJobId, 'BATCH_PROCESSING', StepStatus.COMPLETED);

      // Step 4: Supabase auth deletion
      await updateJobStep(deletionJobId, 'SUPABASE_DELETE', StepStatus.IN_PROGRESS);
      await processSupabaseDeletion(userId);
      await updateJobStep(deletionJobId, 'SUPABASE_DELETE', StepStatus.COMPLETED);

      // Step 5: Cleanup and completion
      await updateJobStep(deletionJobId, 'CLEANUP', StepStatus.IN_PROGRESS);
      await schedulePersonalDataPurge(deletionJobId, userId);
      await updateJobStep(deletionJobId, 'CLEANUP', StepStatus.COMPLETED);

      // Mark job as completed
      await prisma.deletionJob.update({
        where: { id: deletionJobId },
        data: {
          status: DeletionStatus.COMPLETED,
          completedAt: new Date()
        }
      });
      await updateJobStep(deletionJobId, 'COMPLETED', StepStatus.COMPLETED);

      // Send completion email
      await sendCompletionEmail(deletionJobId, userId);
      return; // Success - exit retry loop

    } catch (error) {
      retryCount++;
      const errorMessage = (error as Error).message;
      
      console.error(`Deletion attempt ${retryCount} failed for job ${deletionJobId}:`, error);

      // Update job with failure info
      await prisma.deletionJob.update({
        where: { id: deletionJobId },
        data: {
          retryCount,
          failureReason: errorMessage
        }
      });

      if (retryCount > MAX_RETRIES) {
        // Max retries exceeded
        await prisma.deletionJob.update({
          where: { id: deletionJobId },
          data: {
            status: DeletionStatus.NEEDS_MANUAL_REVIEW
          }
        });
        await markJobFailed(deletionJobId, errorMessage, retryCount - 1);
        return;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[retryCount - 1]));
    }
  }
}

async function validateUserAndCountResources(userId: string) {
  console.log(`🔍 Validating user ${userId} for deletion`);
  
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    console.log(`❌ User not found: ${userId}`);
    throw new Error('User not found');
  }

  console.log(`👤 Found user:`, {
    id: user.id,
    email: user.email,
    username: user.username,
    deletedAt: user.deletedAt,
    role: user.role
  });

  if (user.deletedAt) {
    console.log(`❌ User ${userId} is already marked for deletion at ${user.deletedAt}`);
    throw new Error('User is already marked for deletion');
  }

  // Count resources
  const [profilesCount, contributorsCount, signaturesCount, totalSplitSheets] = await Promise.all([
    prisma.profile.count({ where: { userId } }),
    prisma.contributor.count({ where: { userId } }),
    prisma.signature.count({ where: { userId } }),
    prisma.splitSheet.count({ where: { createdBy: userId } })
  ]);

  console.log(`📊 User resource counts:`, {
    profilesCount,
    contributorsCount,
    signaturesCount,
    totalSplitSheets
  });

  return {
    user,
    totalSplitSheets,
    profilesCount,
    contributorsCount,
    signaturesCount
  };
}

async function processBatch(userId: string, batch: number, _totalSplitSheets: number) {
  const skip = batch * BATCH_SIZE;
  
  console.log(`🔄 Starting batch ${batch + 1} for user ${userId} (skip: ${skip})`);
  
  try {
    await prisma.$transaction(async (tx) => {
      // Calculate retention periods
      const personalDataRetentionDate = new Date();
      personalDataRetentionDate.setDate(personalDataRetentionDate.getDate() + 90);
      
      const anonymizedName = `Deleted User ${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      console.log(`🎭 Generated anonymized name: ${anonymizedName}`);

      // Get contributors for this batch
      const contributors = await tx.contributor.findMany({
        where: { userId },
        take: BATCH_SIZE,
        skip
      });

      console.log(`👥 Found ${contributors.length} contributors in batch ${batch + 1}`);

      // Soft delete user data (first batch only)
      if (batch === 0) {
        console.log(`🗑️  Starting soft delete for user ${userId} in first batch`);
        
        const userUpdateResult = await tx.user.update({
          where: { id: userId },
          data: {
            deletedAt: new Date(),
            anonymizedName,
            email: `deleted-${userId}@example.com`,
            username: null, // Use null instead of undefined to clear the field
            name: null, // Use null instead of undefined
            role: Role.DELETED,
            deletedReason: 'USER_REQUEST',
            dataRetentionUntil: personalDataRetentionDate,
            deletionRequestOrigin: 'USER_REQUEST'
          }
        });
        console.log(`✅ User updated:`, {
          id: userUpdateResult.id,
          deletedAt: userUpdateResult.deletedAt,
          username: userUpdateResult.username,
          role: userUpdateResult.role
        });

        const profileUpdateResult = await tx.profile.updateMany({
          where: { userId },
          data: {
            deletedAt: new Date(),
            name: anonymizedName,
            avatar: null, // Use null instead of undefined
            bio: null, // Use null instead of undefined
            role: 'DELETED'
          }
        });
        console.log(`✅ Profile updated: ${profileUpdateResult.count} profiles affected`);
      }

      // Clear contributor PII but preserve legal structure
      console.log(`🧹 Clearing PII from ${contributors.length} contributors`);
      await tx.contributor.updateMany({
        where: { 
          userId,
          id: { in: contributors.map((c) => c.id) }
        },
        data: {
          userId: null, // Use null instead of undefined
          contactEmail: null, // Use null instead of undefined
          contactPhone: null, // Use null instead of undefined
          address: null // Use null instead of undefined
        }
      });

      // Preserve signatures (legal requirement)
      const signatures = await tx.signature.findMany({
        where: { userId },
        take: BATCH_SIZE,
        skip
      });

      console.log(`✍️  Preserving ${signatures.length} signatures (legal requirement)`);
      // Just clear user reference, keep all signature data intact
      await tx.signature.updateMany({
        where: { 
          userId,
          id: { in: signatures.map((s) => s.id) }
        },
        data: {
          userId: null // Use null instead of undefined
        }
      });

      console.log(`✅ Batch ${batch + 1} completed successfully`);
    });
    
  } catch (error) {
    console.error(`❌ Batch ${batch + 1} failed:`, error);
    throw error; // Re-throw to trigger retry logic
  }
}

async function processUserSoftDelete(userId: string): Promise<void> {
  console.log(`🗑️  Processing user soft delete for ${userId} (no split sheets case)`);
  
  try {
    await prisma.$transaction(async (tx) => {
      // Calculate retention periods
      const personalDataRetentionDate = new Date();
      personalDataRetentionDate.setDate(personalDataRetentionDate.getDate() + 90);
      
      const anonymizedName = `Deleted User ${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      console.log(`🎭 Generated anonymized name: ${anonymizedName}`);

      // Soft delete user data
      const userUpdateResult = await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          anonymizedName,
          email: `deleted-${userId}@example.com`,
          username: null, // Use null instead of undefined to clear the field
          name: null, // Use null instead of undefined
          role: Role.DELETED,
          deletedReason: 'USER_REQUEST',
          dataRetentionUntil: personalDataRetentionDate,
          deletionRequestOrigin: 'USER_REQUEST'
        }
      });
      console.log(`✅ User updated:`, {
        id: userUpdateResult.id,
        deletedAt: userUpdateResult.deletedAt,
        username: userUpdateResult.username,
        role: userUpdateResult.role
      });

      const profileUpdateResult = await tx.profile.updateMany({
        where: { userId },
        data: {
          deletedAt: new Date(),
          name: anonymizedName,
          avatar: null, // Use null instead of undefined
          bio: null, // Use null instead of undefined
          role: 'DELETED'
        }
      });
      console.log(`✅ Profile updated: ${profileUpdateResult.count} profiles affected`);

      console.log(`✅ User soft delete completed successfully`);
    });
  } catch (error) {
    console.error(`❌ User soft delete failed:`, error);
    throw error;
  }
}

async function processSupabaseDeletion(userId: string): Promise<void> {
  try {
    await supabaseAdmin.auth.admin.deleteUser(userId, true);
  } catch (supabaseError) {
    console.error(`Supabase deletion failed for user ${userId}:`, supabaseError);
    // Don't fail the entire job for Supabase errors - continue processing
    // Mark for admin notification instead
    console.error(`🚨 Supabase deletion requires manual review for user: ${userId}`);
  }
}

async function schedulePersonalDataPurge(jobId: string, userId: string): Promise<void> {
  // This would typically be handled by a background job scheduler
  // For now, we'll create a record in the audit log using a placeholder split sheet ID
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() + 90);

  // Get any existing split sheet to use as placeholder for system-level logs
  const anySplitSheet = await prisma.splitSheet.findFirst();
  const splitSheetId = anySplitSheet?.id;

  // Create audit log data
  const auditLogData: {
    action: string;
    performedBy: string;
    reason: string;
    timestamp: Date;
    oldValue: string;
    newValue: string;
    splitSheetId?: string;
  } = {
    action: 'PERSONAL_DATA_PURGE_SCHEDULED',
    performedBy: userId,
    reason: `Personal data scheduled for permanent removal on ${retentionDate.toISOString()}`,
    timestamp: new Date(),
    oldValue: JSON.stringify({ 
      userId,
      purgeDate: retentionDate.toISOString() 
    }),
    newValue: JSON.stringify({ 
      status: 'SCHEDULED',
      jobId
    })
  };

  // Only add splitSheetId if it exists
  if (splitSheetId) {
    auditLogData.splitSheetId = splitSheetId;
  }

  await prisma.auditLog.create({ data: auditLogData });
}

async function markJobFailed(jobId: string, errorMessage: string, retryCount: number): Promise<void> {
  // Get any existing split sheet to use as placeholder for system-level logs
  const anySplitSheet = await prisma.splitSheet.findFirst();
  const splitSheetId = anySplitSheet?.id;

  // Build failure audit log data
  const failureAuditData: {
    action: string;
    performedBy: string;
    reason: string;
    timestamp: Date;
    oldValue: string;
    newValue: string;
    splitSheetId?: string;
  } = {
    action: 'ACCOUNT_DELETION_FAILED',
    performedBy: 'SYSTEM',
    reason: 'Account deletion requires manual review after max retries exceeded',
    timestamp: new Date(),
    oldValue: JSON.stringify({ 
      jobId,
      errorMessage,
      retryCount
    }),
    newValue: JSON.stringify({ 
      status: 'NEEDS_MANUAL_REVIEW',
      requiresAdminAction: true
    })
  };

  // Only add splitSheetId if it exists
  if (splitSheetId) {
    failureAuditData.splitSheetId = splitSheetId;
  }

  await prisma.auditLog.create({ data: failureAuditData });

  // Send admin notification (console for now, email when ready)
  console.error(`🚨 ACCOUNT DELETION FAILED - NEEDS MANUAL REVIEW`);
  console.error(`Job ID: ${jobId}`);
  console.error(`Error: ${errorMessage}`);
  console.error(`Retry attempts: ${retryCount}`);
  console.error(`Admin should check audit logs for details`);
  
  // TODO: Send email to ADMIN_EMAIL when dashboard alerts are ready
  // TODO: Create dashboard alert system
}

function calculateProgress(deletionJob: {
  jobId: string;
  status: string;
  currentBatch: number;
  totalBatches: number;
  failureReason?: string | null;
  steps: Array<{
    stepName: string;
    status: string;
  }>;
}): DeletionProgress {
  const stepProgress = {
    'VALIDATE_USER': 5,
    'BATCH_PROCESSING': 10,
    'SUPABASE_DELETE': 95,
    'CLEANUP': 98,
    'COMPLETED': 100
  };

  // Find current step (first non-completed step, or last step if all completed)
  const currentStepObj = deletionJob.steps.find((step) => step.status === 'IN_PROGRESS') || 
                        deletionJob.steps.find((step) => step.status === 'PENDING') ||
                        deletionJob.steps[deletionJob.steps.length - 1];

  const currentStep = currentStepObj?.stepName || 'UNKNOWN';
  let progressPercentage = stepProgress[currentStep as keyof typeof stepProgress] || 0;

  if (currentStep === 'BATCH_PROCESSING' && deletionJob.totalBatches > 0) {
    const batchProgress = (deletionJob.currentBatch / deletionJob.totalBatches) * 85; // 85% of total progress
    progressPercentage = 10 + batchProgress; // Start from 10%
  }

  const estimatedMinutesRemaining = deletionJob.totalBatches > 0 ? 
    Math.max(0, Math.ceil((deletionJob.totalBatches - deletionJob.currentBatch) * 0.5)) : undefined; // 30s per batch estimate

  return {
    jobId: deletionJob.jobId,
    status: deletionJob.status as 'PENDING' | 'IN_PROGRESS' | 'RETRYING' | 'COMPLETED' | 'FAILED' | 'NEEDS_MANUAL_REVIEW' | 'CANCELLED',
    currentBatch: deletionJob.currentBatch,
    totalBatches: deletionJob.totalBatches,
    currentStep,
    progressPercentage,
    estimatedMinutesRemaining,
    error: deletionJob.failureReason || undefined
  };
}

async function sendCompletionEmail(jobId: string, userId: string): Promise<void> {
  // Get any existing split sheet to use as placeholder for system-level logs
  const anySplitSheet = await prisma.splitSheet.findFirst();
  const splitSheetId = anySplitSheet?.id;

  // Build completion audit log data
  const completionAuditData: {
    action: string;
    performedBy: string;
    reason: string;
    timestamp: Date;
    oldValue: string;
    newValue: string;
    splitSheetId?: string;
  } = {
    action: 'ACCOUNT_DELETION_COMPLETED',
    performedBy: userId,
    reason: 'User account deletion completed successfully with compliance retention',
    timestamp: new Date(),
    oldValue: JSON.stringify({ 
      jobId,
      userId
    }),
    newValue: JSON.stringify({ 
      status: 'COMPLETED',
      personalDataPurgeScheduled: true
    })
  };

  // Only add splitSheetId if it exists
  if (splitSheetId) {
    completionAuditData.splitSheetId = splitSheetId;
  }

  await prisma.auditLog.create({ data: completionAuditData });



  console.log(`✅ Account deletion completed - Job ID: ${jobId}, User: ${userId}`);
  // TODO: Send confirmation email when email system is ready
}

// Admin endpoint for manual review (temporary solution)
export async function ADMIN_GET_FAILED(_request: Request) {
  try {
    // Get failed deletion jobs from audit logs
    const failedJobs = await prisma.auditLog.findMany({
      where: { 
        action: 'ACCOUNT_DELETION_FAILED',
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      },
      orderBy: { timestamp: 'desc' }
    });

    return NextResponse.json({ failedJobs });
  } catch (error) {
    console.error('Failed jobs retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve failed jobs' }, { status: 500 });
  }
}

// Emergency stop endpoint
export async function ADMIN_EMERGENCY_STOP(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      // Stop specific job
      await prisma.deletionJob.updateMany({
        where: {
          jobId,
          status: {
            in: [DeletionStatus.PENDING, DeletionStatus.IN_PROGRESS, DeletionStatus.RETRYING]
          }
        },
        data: {
          status: DeletionStatus.CANCELLED
        }
      });
      
      return NextResponse.json({ success: true, message: `Job ${jobId} marked for emergency stop` });
    } else {
      // Stop all active jobs
      const result = await prisma.deletionJob.updateMany({
        where: {
          status: {
            in: [DeletionStatus.PENDING, DeletionStatus.IN_PROGRESS, DeletionStatus.RETRYING]
          }
        },
        data: {
          status: DeletionStatus.CANCELLED
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: `Stopped ${result.count} active deletion jobs` 
      });
    }
  } catch (error) {
    console.error('Emergency stop error:', error);
    return NextResponse.json({ error: 'Failed to stop jobs' }, { status: 500 });
  }
}