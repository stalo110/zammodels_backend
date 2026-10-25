import { prisma } from "../lib/prisma.js";

export interface InquiryRecord {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export const inquiryModel = {
  create: (input: InquiryRecord) =>
    prisma.inquiry.create({
      data: { ...input, email: input.email.toLowerCase() },
      select: { id: true, subject: true, createdAt: true },
    }),
  list: (input: {
    status?: string;
    search?: string;
    skip: number;
    take: number;
  }) => {
    const where: Record<string, unknown> = {};
    if (input.status) {
      where.status = input.status as "UNREAD" | "READ" | "RESPONDED";
    }
    if (input.search) {
      where.OR = [
        { fullName: { contains: input.search } },
        { email: { contains: input.search } },
        { subject: { contains: input.search } },
      ];
    }

    return prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: input.skip,
      take: input.take,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
      },
    });
  },
  count: (input: { status?: string; search?: string } = {}) => {
    const where: Record<string, unknown> = {};
    if (input.status) {
      where.status = input.status as "UNREAD" | "READ" | "RESPONDED";
    }
    if (input.search) {
      where.OR = [
        { fullName: { contains: input.search } },
        { email: { contains: input.search } },
        { subject: { contains: input.search } },
      ];
    }
    return prisma.inquiry.count({ where });
  },
  findById: (id: string) =>
    prisma.inquiry.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
      },
    }),
  updateStatus: (id: string, status: "UNREAD" | "READ" | "RESPONDED") =>
    prisma.inquiry.update({
      where: { id },
      data: { status },
    }),
};
