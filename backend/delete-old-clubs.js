// Script to delete old seeded clubs directly from the database
require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OLD_CLUB_IDS = [
  '483bc6b2-590f-4bce-a7e4-fa81bcc29c9f', // Nolan's Multiverse
  '36501ddb-a37a-4681-bd0e-f822bc357bb1', // Anime Legends
  'd8043a45-13f0-4380-beba-1df15a4ac521', // Soundtrack Society
];

async function main() {
  for (const id of OLD_CLUB_IDS) {
    try {
      // Delete related data first (in case cascade isn't working)
      await prisma.postLike.deleteMany({ where: { post: { clubId: id } } });
      await prisma.clubPost.deleteMany({ where: { clubId: id } });
      await prisma.discussionReply.deleteMany({ where: { discussion: { clubId: id } } });
      await prisma.clubDiscussion.deleteMany({ where: { clubId: id } });
      await prisma.clubMember.deleteMany({ where: { clubId: id } });
      await prisma.club.delete({ where: { id } });
      console.log(`✅ Deleted club: ${id}`);
    } catch (e) {
      console.error(`❌ Failed to delete ${id}:`, e.message);
    }
  }
  await prisma.$disconnect();
  console.log('Done!');
}

main();
