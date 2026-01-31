// src/app/api/profiles/route.ts (Updated to handle profile creation only if not exists)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, name, role } = await request.json();

    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return NextResponse.json({ profile: existingProfile }, { status: 200 });
    }

    // Create new profile if not exists
    const profile = await prisma.profile.create({
      data: {
        userId,
        name,
        role, // Default ARTIST
      },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error('Profile creation error:', error);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}