import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent } from "@/components/ui/card";
import { StripeConnectButton } from "@/components/dashboard/stripe-connect-button";
import { getTranslations } from "next-intl/server";

export default async function DeveloperEarningsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/en/login");

  const t = await getTranslations("earnings");

  const contracts = await db.contract.findMany({
    where: { developerId: session.user.id },
    include: {
      payments: true,
      project: { select: { title: true } },
    },
  });

  const totalEarned = contracts
    .filter((c) => c.status === "COMPLETED")
    .reduce((sum, c) => sum + Number(c.totalAmount), 0);

  const totalHeld = contracts
    .flatMap((c) => c.payments)
    .filter((p) => p.status === "HELD")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const profile = await db.developerProfile.findUnique({
    where: { userId: session.user.id },
    select: { stripeConnectAccountId: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">{t("title")}</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title={t("totalEarned")} value={`$${totalEarned.toLocaleString()}`} subtitle={t("released")} />
        <StatsCard title={t("inEscrow")} value={`$${totalHeld.toLocaleString()}`} subtitle={t("pendingRelease")} />
        <StatsCard title={t("completed")} value={contracts.filter((c) => c.status === "COMPLETED").length} />
      </div>

      {!profile?.stripeConnectAccountId && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-on-surface">{t("setupPayouts")}</p>
              <p className="text-sm text-on-surface-variant">{t("setupPayoutsDesc")}</p>
            </div>
            <StripeConnectButton />
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-on-surface">{t("paymentHistory")}</h2>
        {contracts.flatMap((c) =>
          c.payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-3 ghost-border">
              <div>
                <p className="text-sm font-medium text-on-surface">{c.project.title}</p>
                <p className="text-xs text-on-surface-variant">{new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-on-surface">${Number(p.amount).toLocaleString()}</p>
                <span className="text-xs text-accent-cyan">{p.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
