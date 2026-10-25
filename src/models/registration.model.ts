import { prisma } from "../lib/prisma.js";

export interface RegistrationRecord {
  fullName: string;
  email: string;
  phone: string;
  location: "LAGOS" | "AWKA";
  bio: string;
  categoryId: number;
  imagePath?: string;
}

export const registrationModel = {
  create: async (input: RegistrationRecord) => {
    const email = input.email.toLowerCase();
    const user = await prisma.user.upsert({
      where: { email },
      update: { fullName: input.fullName, phone: input.phone },
      create: { email, fullName: input.fullName, phone: input.phone },
    });
    return prisma.registration.create({
      data: { ...input, email, userId: user.id, imagePath: input.imagePath },
      select: { id: true, status: true, createdAt: true },
    });
  },
  findPaymentDetails: (id: string) =>
    prisma.registration.findUnique({
      where: { id },
      select: { id: true, email: true, status: true },
    }),
  findById: (id: string) =>
    prisma.registration.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        location: true,
        bio: true,
        imagePath: true,
        status: true,
        createdAt: true,
        category: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
    }),
  list: async (input: {
    search?: string;
    status?: string;
    location?: string;
    categoryId?: number;
    skip: number;
    take: number;
  }) => {
    const where: Record<string, unknown> = {};
    if (input.status) {
      where.status = input.status as "PENDING" | "APPROVED" | "REJECTED";
    }
    if (input.location) {
      where.location = input.location as "LAGOS" | "AWKA";
    }
    if (input.categoryId) {
      where.categoryId = input.categoryId;
    }
    if (input.search) {
      where.OR = [
        { fullName: { contains: input.search } },
        { email: { contains: input.search } },
        { phone: { contains: input.search } },
      ];
    }

    return prisma.registration.findMany({
      where,
      skip: input.skip,
      take: input.take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        location: true,
        imagePath: true,
        status: true,
        createdAt: true,
        category: { select: { id: true, name: true, slug: true } },
        payments: {
          select: { status: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },
  count: async (input?: {
    search?: string;
    status?: string;
    location?: string;
    categoryId?: number;
  }) => {
    const where: Record<string, unknown> = {};
    if (input?.status) {
      where.status = input.status as "PENDING" | "APPROVED" | "REJECTED";
    }
    if (input?.location) {
      where.location = input.location as "LAGOS" | "AWKA";
    }
    if (input?.categoryId) {
      where.categoryId = input.categoryId;
    }
    if (input?.search) {
      where.OR = [
        { fullName: { contains: input.search } },
        { email: { contains: input.search } },
        { phone: { contains: input.search } },
      ];
    }
    return prisma.registration.count({ where });
  },
  updateStatus: (id: string, status: "PENDING" | "APPROVED" | "REJECTED") =>
    prisma.registration.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        location: true,
        status: true,
        createdAt: true,
      },
    }),
  findDistinctEmails: () =>
    prisma.registration.findMany({
      select: { email: true },
      distinct: ["email"],
      orderBy: { createdAt: "desc" },
    }),
};
