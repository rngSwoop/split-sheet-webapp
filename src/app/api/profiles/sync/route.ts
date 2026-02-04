// src/app/api/profiles/sync/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to generate username from user metadata
function generateUsernameFromMetadata(email: string, name?: string): string {
  if (name) {
    // Generate from name
    const nameParts = name.toLowerCase().replace(/[^a-z\s]/g, '').split(' ').filter(Boolean);
    if (nameParts.length >= 2) {
      return `${nameParts[0]}-${nameParts[nameParts.length - 1]}`;
    } else if (nameParts.length === 1) {
      return nameParts[0];
    }
  }
  
  // Fallback to email
  return email.split('@')[0].toLowerCase();
}

export async function POST(request: Request) {
  try {
    const { supabaseUserId, email, name, username } = await request.json();

    // 1. Check if Prisma User exists
    let prismaUser = await prisma.user.findUnique({
      where: { id: supabaseUserId },
    });

    if (!prismaUser) {
      // Create Prisma User synced from Supabase
      prismaUser = await prisma.user.create({
        data: {
          id: supabaseUserId,
          email,
          username: username ? username.toLowerCase() : generateUsernameFromMetadata(email, name),
          name: name || null,
          role: 'ARTIST',
        },
      });
    } else if (username && !prismaUser.username) {
      // Update existing user with username if they don't have one
      prismaUser = await prisma.user.update({
        where: { id: supabaseUserId },
        data: {
          username: username.toLowerCase(),
        },
      });
    }

    // 2. Check if Profile exists
    let profile = await prisma.profile.findUnique({
      where: { userId: prismaUser.id },
    });

    if (profile) {
      // Ensure profile role matches user role for consistency
      if (profile.role !== prismaUser.role) {
        profile = await prisma.profile.update({
          where: { userId: prismaUser.id },
          data: { role: prismaUser.role },
        });
      }
      return NextResponse.json({ profile }, { status: 200 });
    }

    // 3. Create Profile with user's role for consistency
    const newProfile = await prisma.profile.create({
      data: {
        userId: prismaUser.id,
        name: name || null,
        role: prismaUser.role,
      },
    });

    return NextResponse.json({ profile: newProfile }, { status: 201 });
  } catch (error) {
    console.error('Profile sync error:', error);
    return NextResponse.json({ error: 'Failed to sync profile' }, { status: 500 });
  }
}
