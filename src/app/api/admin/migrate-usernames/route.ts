import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Get all users who don't have a username
    const usersWithoutUsername = await prisma.user.findMany({
      where: { username: null },
      select: { id: true, name: true, email: true }
    });

    if (usersWithoutUsername.length === 0) {
      return NextResponse.json({ 
        message: 'All users already have usernames',
        count: 0 
      }, { status: 200 });
    }

    const updatedUsers = [];

    for (const user of usersWithoutUsername) {
      let baseUsername = '';
      
      // Generate base username from name or email
      if (user.name) {
        // Extract name parts and create username
        const nameParts = user.name.toLowerCase().replace(/[^a-z\s]/g, '').split(' ').filter(Boolean);
        if (nameParts.length >= 2) {
          baseUsername = `${nameParts[0]}-${nameParts[nameParts.length - 1]}`;
        } else if (nameParts.length === 1) {
          baseUsername = nameParts[0];
        } else {
          // Fallback to email
          baseUsername = user.email.split('@')[0].toLowerCase();
        }
      } else {
        // Fallback to email if no name
        baseUsername = user.email.split('@')[0].toLowerCase();
      }

      // Check for uniqueness and add random number if needed
      let username = baseUsername;
      let attempts = 0;
      const maxAttempts = 100;
      
      while (attempts < maxAttempts) {
        const existingUser = await prisma.user.findUnique({
          where: { username: attempts === 0 ? baseUsername : `${baseUsername}-${attempts}` }
        });

        if (!existingUser) {
          username = attempts === 0 ? baseUsername : `${baseUsername}-${attempts}`;
          break;
        }
        
        attempts++;
      }

      // If still not unique after many attempts, use a random string
      if (attempts >= maxAttempts) {
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        username = `${baseUsername}-${randomSuffix}`;
      }

      // Update user with username
      await prisma.user.update({
        where: { id: user.id },
        data: { username }
      });

      updatedUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        username
      });
    }

    return NextResponse.json({ 
      message: `Successfully generated usernames for ${updatedUsers.length} users`,
      count: updatedUsers.length,
      users: updatedUsers
    }, { status: 200 });

  } catch (error) {
    console.error('Username migration error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate usernames',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}