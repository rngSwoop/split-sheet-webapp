// src/app/api/invite/generate/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth'; // Helper to get logged-in user from session
import type { Role } from '@prisma/client';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role: rawRole } = await request.json(); // 'LABEL' or 'ADMIN'
  const roleStr = String(rawRole || '').toUpperCase();

  // Validate allowed roles and convert to Prisma Role type
  if (roleStr !== 'LABEL' && roleStr !== 'ADMIN') {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const role = roleStr as Role;

  // Generate a unique uppercase code
  let code = generateUniqueCode(role);
  // Ensure uniqueness (loop in the unlikely event of a collision)
  while (await prisma.inviteCode.findUnique({ where: { code } })) {
    code = generateUniqueCode(role);
  }

  const invite = await prisma.inviteCode.create({
    data: {
      code,
      role,
      createdBy: currentUser.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  return NextResponse.json({ invite });
}

function generateUniqueCode(role: string) {
  return `${role.toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}