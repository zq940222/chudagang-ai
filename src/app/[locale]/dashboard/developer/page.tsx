import { auth } from "@/auth";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/actions/profile";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function DeveloperDashboardPage() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  if (!session) redirect(`/${locale}/login`);

  const t = await getTranslations("devDashboard");
  const profile = await getMyProfile();

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">
          {t("becomeTitle")}
        </h1>
        <p className="max-w-md text-on-surface-variant">
          {t("becomeDesc")}
        </p>
        <Button asChild>
          <Link href="/dashboard/developer/apply">{t("createProfile")}</Link>
        </Button>
      </div>
    );
  }

  const statusLabel =
    profile.status === "APPROVED"
      ? t("statusApproved")
      : profile.status === "PENDING_REVIEW"
        ? t("statusPending")
        : profile.status === "REJECTED"
          ? t("statusRejected")
          : profile.status;

  const [recentContracts, recentNotifications] = await Promise.all([
    db.contract.findMany({
      where: { developerId: session.user!.id },
      include: { project: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.notification.findMany({
      where: { userId: session.user!.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">{t("title")}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title={t("status")}
          value={statusLabel}
          subtitle={t("profileStatus")}
        />
        <StatsCard
          title={t("aiRating")}
          value={profile.aiRating ? Number(profile.aiRating).toFixed(1) : "--"}
          subtitle={t("outOf5")}
        />
        <StatsCard
          title={t("skills")}
          value={profile.skills.length}
          subtitle={t("skillTags")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("recentContracts")}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentContracts.length === 0 ? (
              <p className="text-sm text-on-surface-variant">{t("noContracts")}</p>
            ) : (
              <div className="space-y-3">
                {recentContracts.map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/developer/projects/${c.id}`}
                    className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-3 ghost-border transition-colors hover:bg-surface-container"
                  >
                    <div>
                      <p className="text-sm font-medium text-on-surface">{c.project.title}</p>
                      <p className="text-xs text-on-surface-variant">{c.status}</p>
                    </div>
                    <span className="text-xs text-on-surface-variant">
                      {c.createdAt.toLocaleDateString()}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("recentNotifications")}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-on-surface-variant">{t("noNotifications")}</p>
            ) : (
              <div className="space-y-3">
                {recentNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-lg p-3 ghost-border ${!n.read ? "bg-accent-cyan/5" : "bg-surface-container-lowest"}`}
                  >
                    <p className="text-sm font-medium text-on-surface">{n.title}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant line-clamp-2">{n.body}</p>
                    <p className="mt-1 text-xs text-on-surface-variant/60">
                      {n.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
