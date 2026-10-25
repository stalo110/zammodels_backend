"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inquiryModel = void 0;
const prisma_js_1 = require("../lib/prisma.js");
exports.inquiryModel = {
    create: (input) => prisma_js_1.prisma.inquiry.create({
        data: { ...input, email: input.email.toLowerCase() },
        select: { id: true, subject: true, createdAt: true },
    }),
    list: (input) => {
        const where = {};
        if (input.status) {
            where.status = input.status;
        }
        if (input.search) {
            where.OR = [
                { fullName: { contains: input.search } },
                { email: { contains: input.search } },
                { subject: { contains: input.search } },
            ];
        }
        return prisma_js_1.prisma.inquiry.findMany({
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
    count: (input = {}) => {
        const where = {};
        if (input.status) {
            where.status = input.status;
        }
        if (input.search) {
            where.OR = [
                { fullName: { contains: input.search } },
                { email: { contains: input.search } },
                { subject: { contains: input.search } },
            ];
        }
        return prisma_js_1.prisma.inquiry.count({ where });
    },
    findById: (id) => prisma_js_1.prisma.inquiry.findUnique({
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
    updateStatus: (id, status) => prisma_js_1.prisma.inquiry.update({
        where: { id },
        data: { status },
    }),
};
//# sourceMappingURL=inquiry.model.js.map