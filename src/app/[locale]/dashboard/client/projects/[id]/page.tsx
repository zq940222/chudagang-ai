import { auth } from "@/auth";
import { getLocale } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProjectApplications } from "@/lib/actions/application";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ApplicationList } from "@/components/application/application-list";
import { ContractView } from "@/components/contract/contract-view";
import { ContractActions } from "@/components/contract/contract-actions";
import { DeliverableReview } from "@/components/delivery/deliverable-review";
import { getTranslations } from "next-intl/server";

export default async function ClientProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);
  const t = await getTranslations();

  const project = await db.project.findUnique({
    where: { id },
    include: {
      skills: { include: { skillTag: true } },
      contracts: {
        include: {
          client: { select: { id: true, name: true, avatar: true } },
          developer: { select: { id: true, name: true, avatar: true } },
          payments: { orderBy: { createdAt: "desc" } },
          deliverables: { orderBy: { createdAt: "desc" } },
          project: {
            select: { id: true, title: true, description: true, category: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project || project.clientId !== session.user.id) notFound();

  const applicationsResult = await getProjectApplications(id);
  const applications = applicationsResult.data ?? [];
  const contract = project.contracts[0] ?? null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-on-surface">{project.title}</h1>
      <p className="text-sm text-on-surface-variant">{project.description}</p>

      {contract ? (
        <div className="space-y-4">
          <ContractView contract={contract} />
          <ContractActions
            contractId={contract.id}
            status={contract.status}
            isClient={true}
            isDeveloper={false}
            signedByClient={!!contract.signedByClient}
            signedByDeveloper={!!contract.signedByDeveloper}
          />

          {contract.deliverables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("delivery.deliverables")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contract.deliverables.map((d) => (
                  <DeliverableReview
                    key={d.id}
                    contractId={contract.id}
                    deliverableId={d.id}
                    title={d.title}
                    description={d.description}
                    fileUrl={d.fileUrl}
                    status={d.status}
                    isClient={true}
                    locale={locale}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-on-surface mb-4">
            {t("application.applications")} ({applications.length})
          </h2>
          <ApplicationList applications={applications} isOwner={true} />
        </div>
      )}
    </div>
  );
}
