import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
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

    console.log(`🔐 Admin checking auth status for: ${userId}`);

    try {
      // Get detailed auth user information
      const authUser = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (authUser.error) {
        console.log(`❌ Auth user not found: ${authUser.error.message}`);
        return NextResponse.json({
          existsInAuth: false,
          error: authUser.error.message,
          userId
        });
      }

      const userData = authUser.data?.user || {};
      
      console.log(`✅ Auth user found:`, {
        id: userData.id,
        email: userData.email,
        createdAt: userData.created_at,
        lastSignIn: userData.last_sign_in_at,
        providers: userData.app_metadata?.providers || 'supabase'
      });

return NextResponse.json({
        existsInAuth: true,
        userId: userData.id,
        email: userData.email,
        createdAt: userData.created_at,
        lastSignIn: userData.last_sign_in_at,
        providers: userData.app_metadata?.providers || 'supabase',
        userMetadata: userData.user_metadata,
        appMetadata: userData.app_metadata
      });

    } catch (error) {
      console.error('Auth status check error:', error);
      return NextResponse.json({ 
        error: 'Failed to check auth status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Admin auth status check error:', error);
    return NextResponse.json({ error: 'Failed to process auth status check' }, { status: 500 });
  }
}