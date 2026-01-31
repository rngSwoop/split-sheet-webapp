import { prisma } from '@/lib/prisma';

export default async function Test() {
  try {
    const userCount = await prisma.user.count();
    return <div className="p-8 text-white">Prisma connected! Users in DB: {userCount}</div>;
  } catch (error) {
    return <div className="p-8 text-red-400">Error: {String(error)}</div>;
  }
}