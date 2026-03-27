import { searchDevelopers } from "@/lib/services/matching";
import { DeveloperCard } from "@/components/developer/developer-card";
import { DeveloperFilterSidebar } from "@/components/developer/developer-filter-sidebar";
import { Badge } from "@/components/ui/badge";
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
  const featured = developers[0];
  const rest = developers.slice(1);

  return (
    <div className="flex min-h-screen">
      <DeveloperFilterSidebar />

      <main className="flex-1 p-8 lg:p-12 max-w-7xl">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-4xl font-black tracking-tighter text-on-surface">
              Find Experts
            </h1>
            <span className="text-on-surface-variant text-sm font-medium">
              {total} results found
            </span>
          </div>
          <div className="flex gap-2">
            <Badge variant="accent">Top Rated</Badge>
            <Badge variant="dark">Verified Expert</Badge>
          </div>
        </header>

        {developers.length === 0 ? (
          <p className="py-12 text-center text-on-surface-variant">
            No developers found. Try adjusting your search criteria.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* Featured expert - wide card */}
            {featured && (
              <div className="md:col-span-2 xl:col-span-3">
                <FeaturedDeveloperCard developer={featured} />
              </div>
            )}

            {/* Regular cards */}
            {rest.map((dev) => (
              <DeveloperCard key={dev.id} developer={dev} />
            ))}
          </div>
        )}

        {/* Pagination placeholder */}
        {total > 12 && (
          <div className="mt-20 flex justify-center items-center gap-4">
            <div className="flex gap-2">
              <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary font-bold text-xs">
                1
              </span>
              <span className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high font-bold text-xs cursor-pointer">
                2
              </span>
              <span className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high font-bold text-xs cursor-pointer">
                3
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* Featured developer wide card - inline component */
import { Link } from "@/i18n/navigation";
import type { DeveloperCardData } from "@/types/developer";

function FeaturedDeveloperCard({ developer }: { developer: DeveloperCardData }) {
  const initial = developer.displayName.charAt(0).toUpperCase();
  const currencySymbol =
    developer.currency === "CNY" ? "\u00A5" : developer.currency === "EUR" ? "\u20AC" : "$";

  return (
    <Link href={`/developers/${developer.id}`} className="block">
      <div className="glass rounded-xl p-8 ghost-border bg-gradient-to-br from-surface-container-lowest to-accent-cyan/5 flex flex-col md:flex-row gap-8">
        {/* Avatar section */}
        <div className="md:w-1/4 flex flex-col items-center">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-on-primary text-4xl font-black mb-4">
            {initial}
          </div>
          {developer.aiRating !== null && (
            <div className="flex items-center gap-1 text-secondary font-black text-2xl">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
              </svg>
              {developer.aiRating.toFixed(1)}
            </div>
          )}
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">
            Verified Expert
          </p>
        </div>

        {/* Info section */}
        <div className="md:w-3/4 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-on-surface">
                {developer.displayName}
              </h3>
              {developer.title && (
                <p className="text-secondary font-bold text-sm tracking-tight">
                  {developer.title}
                </p>
              )}
            </div>
            {developer.hourlyRate !== null && (
              <span className="text-2xl font-black text-on-surface">
                {currencySymbol}{developer.hourlyRate}
                <span className="text-sm font-normal text-on-surface-variant">/hr</span>
              </span>
            )}
          </div>

          {developer.bio && (
            <p className="text-on-surface-variant leading-relaxed mb-6 line-clamp-3">
              {developer.bio}
            </p>
          )}

          <div className="flex flex-wrap gap-3 mb-8">
            {developer.skills.slice(0, 5).map((skill) => (
              <Badge key={skill.id} variant="dark">
                {skill.localeEn}
              </Badge>
            ))}
          </div>

          <div className="flex gap-4 mt-auto">
            <span className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
              </svg>
              View Profile
            </span>
            <span className="px-6 py-3 border border-outline-variant/20 rounded-xl font-bold text-xs uppercase tracking-widest">
              Portfolio
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
