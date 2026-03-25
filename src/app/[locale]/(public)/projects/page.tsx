import { searchProjects } from "@/lib/actions/project";
import { ProjectCard } from "@/components/project/project-card";
import type { ProjectSearchParams } from "@/types/project";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const search: ProjectSearchParams = {
    query: typeof params.query === "string" ? params.query : undefined,
    skills: Array.isArray(params.skills)
      ? params.skills
      : typeof params.skills === "string"
        ? [params.skills]
        : undefined,
    minBudget: params.minBudget ? Number(params.minBudget) : undefined,
    maxBudget: params.maxBudget ? Number(params.maxBudget) : undefined,
    page: params.page ? Number(params.page) : 1,
    limit: 12,
  };

  const result = await searchProjects(search);
  const projects = result.data?.projects ?? [];
  const total = result.data?.total ?? 0;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">Projects</h1>
        <p className="mt-1 text-on-surface-variant">
          {total} project{total !== 1 ? "s" : ""} available
        </p>
      </div>

      {projects.length === 0 ? (
        <p className="py-12 text-center text-on-surface-variant">
          No projects found. Try adjusting your search criteria.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </section>
  );
}
