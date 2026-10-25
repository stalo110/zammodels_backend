import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categoryData = [
    {
      name: "Modeling",
      slug: "modeling",
      description: "Runway, editorial and commercial modeling.",
    },
    {
      name: "Music",
      slug: "music",
      description: "Vocal performance and music development.",
    },
    {
      name: "Dance",
      slug: "dance",
      description: "Movement, choreography and dance performance.",
    },
    {
      name: "Acting",
      slug: "acting",
      description: "Screen, stage and presenting talent.",
    },
    {
      name: "Baking",
      slug: "baking",
      description: "Baking craft and creative enterprise.",
    },
    {
      name: "Makeover",
      slug: "makeover",
      description: "Beauty, styling and makeover artistry.",
    },
  ];
  for (const category of categoryData) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }
  const audition = await prisma.category.findUniqueOrThrow({
    where: { slug: "modeling" },
  });
  await prisma.event.upsert({
    where: { slug: "sample-open-audition-day" },
    update: { registrationFeeKobo: 500000 },
    create: {
      title: "Open Audition Day",
      slug: "sample-open-audition-day",
      description:
        "Illustrative sample listing. Replace this event, date and venue with a confirmed Zam programme before publishing.",
      eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      location: "LAGOS",
      venue: "Venue to be confirmed",
      categoryId: audition.id,
      isSample: true,
      registrationFeeKobo: 500000,
    },
  });
}

main().finally(() => prisma.$disconnect());
