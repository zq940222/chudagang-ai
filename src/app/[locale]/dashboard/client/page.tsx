import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Link } from "@/i18n/navigation";

export default async function ClientDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/en/login");

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
      <h1 className="text-2xl font-bold text-on-surface">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Active Projects"
          value={activeProjects}
          subtitle="Published or in progress"
        />
        <StatsCard
          title="Total Projects"
          value={totalProjects}
          subtitle="All time"
        />
        <StatsCard
          title="AI Conversations"
          value={conversations}
          subtitle="With AI assistant"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/chat">AI Assistant</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/dashboard/client/projects/new">Post Project</Link>
        </Button>
      </div>
    </div>
  );
}
