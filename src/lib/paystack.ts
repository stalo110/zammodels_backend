import { HttpError } from "./http-error.js";

// Overridable only so the flow can be exercised against a local mock.
const PAYSTACK_API = process.env.PAYSTACK_API_URL || "https://api.paystack.co";

type PaystackPayload<T> = {
  status: boolean;
  message: string;
  data: T;
};

export type PaystackTransaction = {
  reference: string;
  amount: number;
  currency: string;
  status: string;
  id: string | number;
};

async function paystackRequest<T>(path: string, init: RequestInit): Promise<T> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new HttpError(503, "Payments are not configured yet.");
  }

  let response: Response;
  try {
    response = await fetch(`${PAYSTACK_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new HttpError(
      502,
      "The payment provider could not be reached. Please try again.",
    );
  }

  const payload = (await response
    .json()
    .catch(() => null)) as PaystackPayload<T> | null;
  if (!response.ok || !payload?.status) {
    throw new HttpError(
      502,
      "The payment provider could not complete the request.",
    );
  }
  return payload.data;
}

export function initializePaystackTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  eventId?: number;
  eventTitle?: string;
  registrationId?: string;
}) {
  const callbackUrl =
    process.env.PAYSTACK_CALLBACK_URL ??
    `${process.env.WEB_ORIGIN ?? "https://zammodelsandsignatures.com"}/payment/verify`;
  return paystackRequest<{ authorization_url: string; reference: string }>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount: input.amountKobo,
        currency: "NGN",
        reference: input.reference,
        callback_url: callbackUrl,
        metadata: {
          ...(input.eventId
            ? { eventId: input.eventId, eventTitle: input.eventTitle }
            : {}),
          ...(input.registrationId
            ? { registrationId: input.registrationId }
            : {}),
        },
      }),
    },
  );
}

export function verifyPaystackTransaction(reference: string) {
  return paystackRequest<PaystackTransaction>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: "GET" },
  );
}
