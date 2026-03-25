import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Link } from "@/i18n/navigation";

export default async function DeveloperDashboardPage() {
  const session = await auth();
  if (!session) redirect("/en/login");

  const profile = await getMyProfile();

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">
          Become a Developer
        </h1>
        <p className="max-w-md text-on-surface-variant">
          Create your developer profile to start receiving project matches and
          earning on the platform.
        </p>
        <Button asChild>
          <Link href="/dashboard/developer/profile">Create Profile</Link>
        </Button>
      </div>
    );
  }

  const statusLabel =
    profile.status === "APPROVED"
      ? "Approved"
      : profile.status === "PENDING_REVIEW"
        ? "Pending Review"
        : profile.status;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Status"
          value={statusLabel}
          subtitle="Profile status"
        />
        <StatsCard
          title="AI Rating"
          value={profile.aiRating ? Number(profile.aiRating).toFixed(1) : "--"}
          subtitle="Out of 5.0"
        />
        <StatsCard
          title="Skills"
          value={profile.skills.length}
          subtitle="Skill tags"
        />
      </div>
    </div>
  );
}
