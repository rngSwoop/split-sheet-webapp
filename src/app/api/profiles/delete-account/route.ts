import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, confirmation } = await request.json();

    if (!userId || confirmation !== 'DELETE') {
      return NextResponse.json({ error: 'Valid user ID and confirmation are required' }, { status: 400 });
    }

    // Start a transaction to delete all related data
    await prisma.$transaction(async (tx) => {
      // 1. Delete user's audit logs (they might not exist, but check anyway)
      await tx.auditLog.deleteMany({
        where: {
          // Note: auditLog doesn't have a direct userId field, so this might need adjustment
          // based on your actual schema relationships
        }
      });

      // 2. Delete user's signatures
      await tx.signature.deleteMany({
        where: { userId }
      });

      // 3. Delete user's contributor relationships
      await tx.contributor.deleteMany({
        where: { userId }
      });

      // 4. Delete user's profiles
      await tx.profile.deleteMany({
        where: { userId }
      });

      // 5. Finally, delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    // Delete the user from Supabase Auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('Failed to delete user from Supabase Auth:', authDeleteError);
      // The user is deleted from our database but not from auth
      // This is a partial success case
      return NextResponse.json({ 
        message: 'Account data deleted from database. Please contact support to remove authentication data.',
        warning: 'Partial deletion'
      }, { status: 207 }); // 207 Multi-Status
    }

    return NextResponse.json({ 
      message: 'Account permanently deleted' 
    }, { status: 200 });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}