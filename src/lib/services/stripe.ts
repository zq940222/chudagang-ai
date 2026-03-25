import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

const PLATFORM_FEE_PERCENT = 10;

export async function createCheckoutSession(opts: {
  contractId: string;
  amount: number;
  currency: string;
  clientEmail: string;
  projectTitle: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: opts.clientEmail,
    line_items: [
      {
        price_data: {
          currency: opts.currency.toLowerCase(),
          unit_amount: Math.round(opts.amount * 100),
          product_data: {
            name: `Contract Payment: ${opts.projectTitle}`,
            description: `Contract ID: ${opts.contractId}`,
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      capture_method: "manual",
      metadata: { contractId: opts.contractId },
    },
    metadata: { contractId: opts.contractId },
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  });

  return session;
}

export async function capturePayment(paymentIntentId: string) {
  return stripe.paymentIntents.capture(paymentIntentId);
}

export async function createConnectOnboardingLink(opts: {
  email: string;
  userId: string;
  returnUrl: string;
  refreshUrl: string;
}) {
  const account = await stripe.accounts.create({
    type: "express",
    email: opts.email,
    metadata: { userId: opts.userId },
    capabilities: {
      transfers: { requested: true },
    },
  });

  const link = await stripe.accountLinks.create({
    account: account.id,
    type: "account_onboarding",
    return_url: opts.returnUrl,
    refresh_url: opts.refreshUrl,
  });

  return { accountId: account.id, url: link.url };
}

export async function transferToDeveloper(opts: {
  amount: number;
  currency: string;
  connectedAccountId: string;
  contractId: string;
}) {
  const fee = Math.round(opts.amount * (PLATFORM_FEE_PERCENT / 100) * 100);
  const transferAmount = Math.round(opts.amount * 100) - fee;

  return stripe.transfers.create({
    amount: transferAmount,
    currency: opts.currency.toLowerCase(),
    destination: opts.connectedAccountId,
    metadata: { contractId: opts.contractId },
  });
}
