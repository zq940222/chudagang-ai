import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getContract } from "@/lib/actions/contract";
import { ContractView } from "@/components/contract/contract-view";
import { ContractActions } from "@/components/contract/contract-actions";
import { DeliveryForm } from "@/components/delivery/delivery-form";
import { getTranslations } from "next-intl/server";

export default async function DeveloperContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/en/login");

  const { id } = await params;
  const t = await getTranslations("delivery");
  const result = await getContract(id);

  if (result.error || !result.data) notFound();
  const contract = result.data;

  if (contract.developerId !== session.user.id) notFound();

  return (
    <div className="space-y-6">
      <ContractView contract={contract} />

      <ContractActions
        contractId={contract.id}
        status={contract.status}
        isClient={false}
        isDeveloper={true}
        signedByClient={!!contract.signedByClient}
        signedByDeveloper={!!contract.signedByDeveloper}
      />

      {contract.status === "ACTIVE" && (
        <DeliveryForm contractId={contract.id} />
      )}

      {contract.deliverables.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-on-surface">{t("deliverables")}</h3>
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
              {d.reviewComment && (
                <p className="mt-2 text-xs text-error">{t("review")}{d.reviewComment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
