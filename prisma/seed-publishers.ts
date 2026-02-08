import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PUBLISHERS = [
  // Major publishers
  { name: 'Sony Music Publishing', email: 'info@sonymusicpub.com' },
  { name: 'Universal Music Publishing Group', email: 'info@umusicpub.com' },
  { name: 'Warner Chappell Music', email: 'info@warnerchappell.com' },
  { name: 'BMG Rights Management', email: 'info@bmg.com' },
  { name: 'Kobalt Music Publishing', email: 'info@kobaltmusic.com' },
  // Major independents
  { name: 'Concord Music Publishing', email: 'info@concordmusicpublishing.com' },
  { name: 'Downtown Music Publishing', email: 'info@dfrnt.com' },
  { name: 'Reservoir Media', email: 'info@reservoir-media.com' },
  { name: 'Spirit Music Group', email: 'info@spiritmusicgroup.com' },
  { name: 'Peermusic', email: 'info@peermusic.com' },
  { name: 'Round Hill Music', email: 'info@roundhillmusic.com' },
  { name: 'Primary Wave Music Publishing', email: 'info@primarywave.com' },
  { name: 'Hipgnosis Songs', email: 'info@hipgnosissongs.com' },
  { name: 'Big Deal Music', email: 'info@bigdealmusic.com' },
  // Notable independents
  { name: 'Pulse Music Group', email: 'info@pulsemusicgroup.com' },
  { name: 'Position Music', email: 'info@positionmusic.com' },
  { name: 'Anthem Entertainment', email: 'info@anthementertainment.com' },
  { name: 'Ultra Music Publishing', email: 'info@ultramusic.com' },
  { name: 'Prescription Songs', email: 'info@prescriptionsongs.com' },
  { name: 'TuneCore Publishing', email: 'info@tunecore.com' },
  { name: 'Songtrust (Downtown)', email: 'info@songtrust.com' },
  { name: 'CD Baby Publishing (DistroKid)', email: 'info@cdbaby.com' },
  { name: 'Sentric Music', email: 'info@sentricmusic.com' },
  { name: 'AWAL Publishing', email: 'info@awal.com' },
];

async function main() {
  for (const pub of PUBLISHERS) {
    const existing = await prisma.publisher.findFirst({
      where: { name: pub.name },
    });

    if (existing) {
      console.log(`Already exists: ${pub.name} (${existing.id})`);
    } else {
      const record = await prisma.publisher.create({
        data: {
          name: pub.name,
          email: pub.email,
        },
      });
      console.log(`Created: ${record.name} (${record.id})`);
    }
  }
}

main()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
