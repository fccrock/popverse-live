const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MOCK_CLUBS = [
  {
    slug: "nolans-multiverse",
    name: "Nolan's Multiverse",
    description: "A club for Christopher Nolan fans. We dissect timelines, debate endings, and rank every Hans Zimmer score.",
    coverImage: "https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    category: "movies",
    createdBy: "cinephile_max",
    members: [
      { username: "cinephile_max", role: "admin" },
      { username: "film_nerd_42", role: "member" },
      { username: "dream_walker", role: "member" },
    ]
  },
  {
    slug: "anime-legends",
    name: "Anime Legends",
    description: "From Ghibli to Chainsaw Man — we celebrate the art of anime.",
    coverImage: "https://image.tmdb.org/t/p/w1280/kzjISfaYVKXniRAMNOIKZdVRqJo.jpg",
    category: "anime",
    createdBy: "otaku_sage",
    members: [
      { username: "otaku_sage", role: "admin" },
      { username: "mecha_pilot", role: "moderator" },
    ]
  },
  {
    slug: "soundtrack-society",
    name: "Soundtrack Society",
    description: "For those who listen to movie soundtracks on repeat.",
    coverImage: "https://image.tmdb.org/t/p/w1280/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    category: "music",
    createdBy: "score_hunter",
    members: [
      { username: "score_hunter", role: "admin" },
      { username: "piano_noir", role: "member" },
    ]
  }
];

async function main() {
  console.log("Seeding AWS Database...");

  for (const clubData of MOCK_CLUBS) {
    // Upsert the creator
    let creator = await prisma.user.findUnique({ where: { username: clubData.createdBy } });
    if (!creator) {
      creator = await prisma.user.create({
        data: { cognitoId: clubData.createdBy, username: clubData.createdBy }
      });
    }

    // Upsert the club
    const club = await prisma.club.upsert({
      where: { slug: clubData.slug },
      update: {},
      create: {
        name: clubData.name,
        slug: clubData.slug,
        description: clubData.description,
        coverImage: clubData.coverImage,
        category: clubData.category,
        createdBy: creator.username,
      }
    });

    // Add members
    for (const member of clubData.members) {
      let user = await prisma.user.findUnique({ where: { username: member.username } });
      if (!user) {
        user = await prisma.user.create({
          data: { cognitoId: member.username, username: member.username }
        });
      }

      await prisma.clubMember.upsert({
        where: {
          clubId_userId: { clubId: club.id, userId: user.id }
        },
        update: {},
        create: {
          clubId: club.id,
          userId: user.id,
          role: member.role
        }
      });
    }
    console.log(`Created club: ${club.name}`);
  }
  console.log("Seeding finished!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
