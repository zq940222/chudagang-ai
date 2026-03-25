import { searchDevelopers } from "@/lib/services/matching";
import { DeveloperCard } from "@/components/developer/developer-card";
import type { DeveloperSearchParams } from "@/types/developer";

export default async function DevelopersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const search: DeveloperSearchParams = {
    query: typeof params.query === "string" ? params.query : undefined,
    skills: Array.isArray(params.skills)
      ? params.skills
      : typeof params.skills === "string"
        ? [params.skills]
        : undefined,
    minRate: params.minRate ? Number(params.minRate) : undefined,
    maxRate: params.maxRate ? Number(params.maxRate) : undefined,
    page: params.page ? Number(params.page) : 1,
    limit: 12,
  };

  const { developers, total } = await searchDevelopers(search);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">Developers</h1>
        <p className="mt-1 text-on-surface-variant">
          {total} developer{total !== 1 ? "s" : ""} available
        </p>
      </div>

      {developers.length === 0 ? (
        <p className="py-12 text-center text-on-surface-variant">
          No developers found. Try adjusting your search criteria.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {developers.map((dev) => (
            <DeveloperCard key={dev.id} developer={dev} />
          ))}
        </div>
      )}
    </section>
  );
}
