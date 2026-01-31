import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, newUsername } = await request.json();

    if (!userId || !newUsername) {
      return NextResponse.json({ error: 'User ID and new username are required' }, { status: 400 });
    }

    // Validate username format and availability (same rules as signup)
    const trimmedUsername = newUsername.trim();
    
    if (trimmedUsername.length < 4) {
      return NextResponse.json({ error: 'Username must be at least 4 characters' }, { status: 400 });
    }
    
    if (trimmedUsername.length > 30) {
      return NextResponse.json({ error: 'Username must be less than 30 characters' }, { status: 400 });
    }
    
    const reservedNames = ['admin', 'system', 'user', 'root', 'administrator', 'moderator', 'staff'];
    if (reservedNames.includes(trimmedUsername.toLowerCase())) {
      return NextResponse.json({ error: 'This username is reserved and cannot be used' }, { status: 400 });
    }
    
    if (!/^[a-zA-Z0-9._-]+$/.test(trimmedUsername)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, dots, hyphens, and underscores' }, { status: 400 });
    }

    const normalizedUsername = trimmedUsername.toLowerCase();

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: { 
        username: normalizedUsername,
        id: { not: userId }
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }

    // Update username in Prisma
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { username: normalizedUsername },
      select: { id: true, username: true, email: true }
    });

    // Update username in Supabase user metadata
    const { error: supabaseError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { username: normalizedUsername } }
    );

    if (supabaseError) {
      console.error('Failed to update Supabase user metadata:', supabaseError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ 
      message: 'Username updated successfully',
      user: updatedUser 
    }, { status: 200 });

  } catch (error) {
    console.error('Username update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}