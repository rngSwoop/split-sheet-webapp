// src/app/api/profiles/sync/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { supabaseUserId, email, name } = await request.json();

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
          name: name || null,
          role: 'ARTIST',
        },
      });
    }

    // 2. Check if Profile exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: prismaUser.id },
    });

    if (existingProfile) {
      return NextResponse.json({ profile: existingProfile }, { status: 200 });
    }

    // 3. Create Profile
    const profile = await prisma.profile.create({
      data: {
        userId: prismaUser.id,
        name: name || null,
        role: 'ARTIST',
      },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error('Profile sync error:', error);
    return NextResponse.json({ error: 'Failed to sync profile' }, { status: 500 });
  }
}