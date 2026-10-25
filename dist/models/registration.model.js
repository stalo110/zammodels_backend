"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrationModel = void 0;
const prisma_js_1 = require("../lib/prisma.js");
exports.registrationModel = {
    create: async (input) => {
        const email = input.email.toLowerCase();
        const user = await prisma_js_1.prisma.user.upsert({
            where: { email },
            update: { fullName: input.fullName, phone: input.phone },
            create: { email, fullName: input.fullName, phone: input.phone },
        });
        return prisma_js_1.prisma.registration.create({
            data: { ...input, email, userId: user.id, imagePath: input.imagePath },
            select: { id: true, status: true, createdAt: true },
        });
    },
    findPaymentDetails: (id) => prisma_js_1.prisma.registration.findUnique({
        where: { id },
        select: { id: true, email: true, status: true },
    }),
    findById: (id) => prisma_js_1.prisma.registration.findUnique({
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
    list: async (input) => {
        const where = {};
        if (input.status) {
            where.status = input.status;
        }
        if (input.location) {
            where.location = input.location;
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
        return prisma_js_1.prisma.registration.findMany({
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
    count: async (input) => {
        const where = {};
        if (input?.status) {
            where.status = input.status;
        }
        if (input?.location) {
            where.location = input.location;
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
        return prisma_js_1.prisma.registration.count({ where });
    },
    updateStatus: (id, status) => prisma_js_1.prisma.registration.update({
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
    findDistinctEmails: () => prisma_js_1.prisma.registration.findMany({
        select: { email: true },
        distinct: ["email"],
        orderBy: { createdAt: "desc" },
    }),
};
//# sourceMappingURL=registration.model.js.map