import { prisma } from "../lib/prisma.js";

export const categoryModel = {
  list: () =>
    prisma.category.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true, slug: true, description: true },
    }),
};
