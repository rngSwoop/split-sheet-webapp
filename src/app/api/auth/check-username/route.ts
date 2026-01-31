import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();
    
    if (!username || username.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Username is required' 
      }, { status: 400 });
    }
    
    const trimmedUsername = username.trim();
    
    // Username validation rules
    if (trimmedUsername.length < 4) {
      return NextResponse.json({ 
        error: 'Username must be at least 4 characters' 
      }, { status: 400 });
    }
    
    if (trimmedUsername.length > 30) {
      return NextResponse.json({ 
        error: 'Username must be less than 30 characters' 
      }, { status: 400 });
    }
    
    // Check for reserved names (case insensitive)
    const reservedNames = ['admin', 'system', 'user', 'root', 'administrator', 'moderator', 'staff'];
    if (reservedNames.includes(trimmedUsername.toLowerCase())) {
      return NextResponse.json({ 
        error: 'This username is reserved and cannot be used' 
      }, { status: 400 });
    }
    
    // Allow special characters but validate format
    if (!/^[a-zA-Z0-9._-]+$/.test(trimmedUsername)) {
      return NextResponse.json({ 
        error: 'Username can only contain letters, numbers, dots, hyphens, and underscores' 
      }, { status: 400 });
    }
    
    const normalizedUsername = trimmedUsername.toLowerCase();
    
    // Check if username exists in database
    const existingUser = await prisma.user.findUnique({
      where: { username: normalizedUsername }
    });
    
    return NextResponse.json({ 
      available: !existingUser,
      username: normalizedUsername 
    });
    
  } catch (error) {
    console.error('Username check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check username' 
    }, { status: 500 });
  }
}