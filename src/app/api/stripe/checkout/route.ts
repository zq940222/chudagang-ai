import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createCheckoutSession } from "@/lib/services/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contractId } = await req.json();

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    include: { project: { select: { title: true } } },
  });

  if (!contract) {
    return Response.json({ error: "Contract not found" }, { status: 404 });
  }
  if (contract.clientId !== session.user.id) {
    return Response.json({ error: "Only the client can pay" }, { status: 403 });
  }
  if (contract.status !== "ACTIVE") {
    return Response.json(
      { error: "Contract must be signed before payment" },
      { status: 400 }
    );
  }

  const locale = session.user.locale || "en";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const checkoutSession = await createCheckoutSession({
    contractId: contract.id,
    amount: Number(contract.totalAmount),
    currency: contract.currency,
    clientEmail: session.user.email,
    projectTitle: contract.project.title,
    successUrl: `${baseUrl}/${locale}/dashboard/client/projects/${contract.projectId}?payment=success`,
    cancelUrl: `${baseUrl}/${locale}/dashboard/client/projects/${contract.projectId}?payment=cancelled`,
  });

  return Response.json({ url: checkoutSession.url });
}
