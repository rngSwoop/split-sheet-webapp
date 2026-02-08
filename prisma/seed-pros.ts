import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PRO_ORGS = ['ASCAP', 'BMI', 'SESAC'];

async function main() {
  for (const name of PRO_ORGS) {
    const record = await prisma.performanceRightsOrg.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`Upserted PRO: ${record.name} (${record.id})`);
  }
}

main()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
