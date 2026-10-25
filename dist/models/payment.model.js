"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentModel = void 0;
const prisma_js_1 = require("../lib/prisma.js");
exports.paymentModel = {
    createPending: (input) => prisma_js_1.prisma.payment.create({
        data: { ...input, email: input.email.toLowerCase() },
        select: { id: true, reference: true, amountKobo: true, status: true },
    }),
    findByReference: (reference) => prisma_js_1.prisma.payment.findUnique({ where: { reference } }),
    markFailed: (reference) => prisma_js_1.prisma.payment.updateMany({
        where: { reference, status: "PENDING" },
        data: { status: "FAILED" },
    }),
    markSuccess: (reference, gatewayTransactionId) => prisma_js_1.prisma.payment.update({
        where: { reference },
        data: { status: "SUCCESS", gatewayTransactionId, paidAt: new Date() },
        select: {
            reference: true,
            eventId: true,
            amountKobo: true,
            currency: true,
            status: true,
            paidAt: true,
        },
    }),
};
//# sourceMappingURL=payment.model.js.map