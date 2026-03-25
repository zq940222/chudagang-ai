import { headers } from "next/headers";
import { db } from "@/lib/db";
import { stripe } from "@/lib/services/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const existing = await db.processedWebhookEvent.findUnique({
    where: { providerEventId: event.id },
  });
  if (existing) {
    return Response.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const contractId = session.metadata?.contractId;
        if (!contractId) break;

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        await db.payment.create({
          data: {
            contractId,
            amount: (session.amount_total ?? 0) / 100,
            currency: session.currency?.toUpperCase() ?? "USD",
            provider: "STRIPE",
            providerPaymentId: paymentIntentId ?? null,
            providerEventId: event.id,
            status: "HELD",
            paidAt: new Date(),
          },
        });

        const contract = await db.contract.findUnique({
          where: { id: contractId },
          select: { developerId: true, project: { select: { title: true } } },
        });
        if (contract) {
          await db.notification.create({
            data: {
              userId: contract.developerId,
              type: "PAYMENT_RECEIVED",
              title: "Payment Received (Escrow)",
              body: `Client has paid for "${contract.project.title}". Funds held in escrow.`,
              link: `/dashboard/developer/projects/${contractId}`,
            },
          });
        }
        break;
      }
    }

    await db.processedWebhookEvent.create({
      data: {
        providerEventId: event.id,
        provider: "STRIPE",
      },
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
