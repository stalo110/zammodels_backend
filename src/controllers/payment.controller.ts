import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
} from "../lib/paystack.js";
import { eventModel } from "../models/event.model.js";
import { paymentModel } from "../models/payment.model.js";
import { registrationModel } from "../models/registration.model.js";

const initializeSchema = z
  .object({
    eventId: z.coerce.number().int().positive().optional(),
    registrationId: z.string().trim().min(8).max(30).optional(),
    email: z.string().trim().email().max(255),
  })
  .refine((input) => Boolean(input.eventId) !== Boolean(input.registrationId), {
    message: "Provide either an event or audition registration.",
  });
const referenceSchema = z.object({
  reference: z.string().trim().min(8).max(100),
});

async function verifyAndRecord(reference: string) {
  const payment = await paymentModel.findByReference(reference);
  if (!payment) throw new HttpError(404, "Payment reference was not found.");
  if (payment.status === "SUCCESS") return payment;

  const transaction = await verifyPaystackTransaction(reference);
  if (
    transaction.reference !== payment.reference ||
    transaction.amount !== payment.amountKobo ||
    transaction.currency !== payment.currency
  ) {
    throw new HttpError(
      409,
      "The verified transaction does not match this payment.",
    );
  }
  if (transaction.status === "success") {
    return paymentModel.markSuccess(payment.reference, String(transaction.id));
  }
  if (transaction.status === "failed" || transaction.status === "abandoned") {
    await paymentModel.markFailed(payment.reference);
    return { ...payment, status: "FAILED" as const };
  }
  return { ...payment, status: "PENDING" as const };
}

export async function initializePayment(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  let reference: string | undefined;
  try {
    const input = initializeSchema.parse(request.body);
    let eventTitle: string | undefined;
    let amountKobo: number;
    let paymentEmail = input.email;
    let eventId: number | undefined;
    let registrationId: string | undefined;

    if (input.registrationId) {
      const registration = await registrationModel.findPaymentDetails(
        input.registrationId,
      );
      if (!registration)
        throw new HttpError(404, "Audition registration was not found.");
      registrationId = registration.id;
      paymentEmail = registration.email;
      amountKobo = Number(process.env.AUDITION_REGISTRATION_FEE_KOBO ?? 500000);
      eventTitle = "Zam audition registration";
    } else {
      const event = await eventModel.findById(input.eventId!);
      if (
        !event ||
        event.status !== "UPCOMING" ||
        event.eventDate <= new Date()
      ) {
        throw new HttpError(404, "This event is not open for registration.");
      }
      if (!event.registrationFeeKobo || event.registrationFeeKobo < 1) {
        throw new HttpError(
          400,
          "Online payment is not enabled for this event.",
        );
      }
      eventId = event.id;
      amountKobo = event.registrationFeeKobo;
      eventTitle = event.title;
    }
    if (!Number.isSafeInteger(amountKobo) || amountKobo < 1) {
      throw new HttpError(
        503,
        "The registration fee is not configured correctly.",
      );
    }

    reference = randomUUID();
    await paymentModel.createPending({
      reference,
      eventId,
      registrationId,
      email: paymentEmail,
      amountKobo,
    });
    try {
      const checkout = await initializePaystackTransaction({
        email: paymentEmail,
        amountKobo,
        reference,
        eventId,
        registrationId,
        eventTitle,
      });
      response
        .status(201)
        .json({
          data: { authorizationUrl: checkout.authorization_url, reference },
        });
    } catch (error) {
      await paymentModel.markFailed(reference);
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

export async function verifyPayment(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const { reference } = referenceSchema.parse(request.body);
    const payment = await verifyAndRecord(reference);
    response.json({
      data: {
        reference: payment.reference,
        status: payment.status,
        amountKobo: payment.amountKobo,
        currency: payment.currency,
        paidAt: payment.paidAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function receivePaystackWebhook(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    if (!Buffer.isBuffer(request.body))
      throw new HttpError(400, "Invalid webhook payload.");
    let payload: unknown;
    try {
      payload = JSON.parse(request.body.toString("utf8"));
    } catch {
      throw new HttpError(400, "Invalid webhook payload.");
    }
    const webhookSchema = z.object({
      event: z.string(),
      data: z.object({ reference: z.string().min(8).max(100) }),
    });
    const webhook = webhookSchema.parse(payload);
    if (webhook.event === "charge.success") {
      try {
        await verifyAndRecord(webhook.data.reference);
      } catch (error) {
        // References from other integrations on the same Paystack account
        // are acknowledged so Paystack does not keep retrying them.
        if (!(error instanceof HttpError && error.statusCode === 404))
          throw error;
      }
    }
    response.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
}
