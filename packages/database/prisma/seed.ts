import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear all plans
  await prisma.plan.deleteMany();

  // Create plans
  await prisma.plan.createMany({
    data: [
      // Free Plan
      {
        id: 'free-plan',
        name: 'Free Plan',
        price: 0,
        description: 'Free plan',
        isActive: true,
        maxFeeds: 1,
        maxAuthors: 1,
        maxTags: 1,
        programDuration: 7,
      },
      // Pro Plan
      {
        id: 'pro-plan',
        name: 'Pro Plan',
        price: 500,
        description: 'Pro plan',
        isActive: true,
        maxFeeds: 3,
        maxAuthors: 5,
        maxTags: 5,
        programDuration: 30,
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
