import { auth } from "@/auth";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function ClientDashboardPage() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const t = await getTranslations("clientDashboard");

  const [activeProjects, totalProjects, conversations] = await Promise.all([
    db.project.count({
      where: { clientId: session.user.id, status: { in: ["PUBLISHED", "IN_PROGRESS"] } },
    }),
    db.project.count({
      where: { clientId: session.user.id },
    }),
    db.conversation.count({
      where: { userId: session.user.id },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">{t("title")}</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title={t("activeProjects")}
          value={activeProjects}
          subtitle={t("activeProjectsDesc")}
        />
        <StatsCard
          title={t("totalProjects")}
          value={totalProjects}
          subtitle={t("totalProjectsDesc")}
        />
        <StatsCard
          title={t("aiConversations")}
          value={conversations}
          subtitle={t("aiConversationsDesc")}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/chat">{t("aiAssistant")}</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/dashboard/client/projects/new">{t("postProject")}</Link>
        </Button>
      </div>
    </div>
  );
}
