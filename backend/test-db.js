process.env.DATABASE_URL = 'postgresql://postgres:Sanskar1973@popculture-db.cfceq8w60b15.ap-south-1.rds.amazonaws.com:5432/postgres';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const clubs = await prisma.club.findMany();
    console.log('SUCCESS - clubs count:', clubs.length);
  } catch (e) {
    console.error('PRISMA ERROR:', e.message);
    console.error('Error code:', e.code);
  } finally {
    await prisma.$disconnect();
  }
}

main();
