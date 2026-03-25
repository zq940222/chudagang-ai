import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProjectApplications } from "@/lib/actions/application";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ApplicationList } from "@/components/application/application-list";
import { ContractView } from "@/components/contract/contract-view";
import { ContractActions } from "@/components/contract/contract-actions";

export default async function ClientProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/en/login");

  const { id } = await params;

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
            signedByClient={contract.signedByClient}
            signedByDeveloper={contract.signedByDeveloper}
          />

          {contract.deliverables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Deliverables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contract.deliverables.map((d) => (
                  <div key={d.id} className="rounded-lg bg-surface-container-lowest p-3 ghost-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-on-surface text-sm">{d.title}</p>
                        {d.description && (
                          <p className="mt-1 text-xs text-on-surface-variant">{d.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-accent-cyan">{d.status}</span>
                    </div>
                    {d.fileUrl && (
                      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-accent-cyan underline">
                        View file
                      </a>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-on-surface mb-4">
            Applications ({applications.length})
          </h2>
          <ApplicationList applications={applications} isOwner={true} />
        </div>
      )}
    </div>
  );
}
