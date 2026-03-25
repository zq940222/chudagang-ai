import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe, createConnectOnboardingLink } from "@/lib/services/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await db.developerProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return Response.json(
      { error: "Developer profile required" },
      { status: 400 }
    );
  }

  if (profile.stripeConnectAccountId) {
    const loginLink = await stripe.accounts.createLoginLink(
      profile.stripeConnectAccountId
    );
    return Response.json({ url: loginLink.url });
  }

  const locale = session.user.locale || "en";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { accountId, url } = await createConnectOnboardingLink({
    email: session.user.email,
    userId: session.user.id,
    returnUrl: `${baseUrl}/${locale}/dashboard/developer?stripe=success`,
    refreshUrl: `${baseUrl}/${locale}/dashboard/developer?stripe=refresh`,
  });

  await db.developerProfile.update({
    where: { id: profile.id },
    data: { stripeConnectAccountId: accountId },
  });

  return Response.json({ url });
}
