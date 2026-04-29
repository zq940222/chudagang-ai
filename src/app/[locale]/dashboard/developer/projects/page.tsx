import { auth } from "@/auth";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { getMyContracts } from "@/lib/actions/contract";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function DeveloperProjectsPage() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const t = await getTranslations("devContracts");
  const result = await getMyContracts("developer");
  const contracts = result.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">{t("title")}</h1>

      {contracts.length === 0 ? (
        <div className="rounded-xl bg-surface-container-low p-8 text-center">
          <p className="text-on-surface-variant">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <Link key={c.id} href={`/dashboard/developer/projects/${c.id}`}>
              <Card className="hover:bg-surface-container-low transition-colors cursor-pointer">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-on-surface">{c.title}</p>
                      <p className="text-sm text-on-surface-variant">
                        {c.projectTitle} &middot; {c.counterpartyName ?? "Client"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-on-surface">
                        ${c.totalAmount.toLocaleString()}
                      </p>
                      <span className="text-xs text-accent-cyan">{c.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
