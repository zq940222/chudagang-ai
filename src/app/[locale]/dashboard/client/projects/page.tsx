import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyProjects } from "@/lib/actions/project";
import { ProjectCard } from "@/components/project/project-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function ClientProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/en/login");

  const result = await getMyProjects();
  const projects = result.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-on-surface">My Projects</h1>
        <Button asChild>
          <Link href="/dashboard/client/projects/new">New Project</Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <p className="py-12 text-center text-on-surface-variant">
          You haven&apos;t created any projects yet.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
