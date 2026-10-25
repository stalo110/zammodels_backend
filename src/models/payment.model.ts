import { prisma } from "../lib/prisma.js";

export const paymentModel = {
  createPending: (input: {
    reference: string;
    eventId?: number;
    registrationId?: string;
    email: string;
    amountKobo: number;
  }) =>
    prisma.payment.create({
      data: { ...input, email: input.email.toLowerCase() },
      select: { id: true, reference: true, amountKobo: true, status: true },
    }),
  findByReference: (reference: string) =>
    prisma.payment.findUnique({ where: { reference } }),
  markFailed: (reference: string) =>
    prisma.payment.updateMany({
      where: { reference, status: "PENDING" },
      data: { status: "FAILED" },
    }),
  markSuccess: (reference: string, gatewayTransactionId: string) =>
    prisma.payment.update({
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
