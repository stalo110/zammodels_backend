import { prisma } from "../lib/prisma.js";

export const eventModel = {
  list: () =>
    prisma.event.findMany({
      where: { status: { in: ["UPCOMING", "PAST"] } },
      orderBy: { eventDate: "asc" },
      include: { category: { select: { name: true, slug: true } } },
    }),
  findById: (id: number) => prisma.event.findUnique({ where: { id } }),
};
