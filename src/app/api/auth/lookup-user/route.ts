import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();

    if (!identifier) {
      return NextResponse.json({ error: 'Identifier is required' }, { status: 400 });
    }

    // Check if identifier looks like an email
    const isEmail = identifier.includes('@') && identifier.includes('.');

    let user;

    if (isEmail) {
      // Direct email lookup (excluding deleted users)
      user = await prisma.user.findFirst({
        where: { 
          email: identifier.toLowerCase(),
          deletedAt: null // Only check active users
        },
        select: { email: true },
      });
    } else {
      // Username lookup (excluding deleted users)
      user = await prisma.user.findFirst({
        where: { 
          username: identifier.toLowerCase(),
          deletedAt: null // Only check active users
        },
        select: { email: true },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ email: user.email }, { status: 200 });

  } catch (error) {
    console.error('User lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}