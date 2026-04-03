"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ContractWithDetails } from "@/types/contract";

const statusColors: Record<string, string> = {
  DRAFT: "bg-surface-container-high text-on-surface-variant",
  PENDING_SIGN: "bg-tertiary/10 text-tertiary",
  ACTIVE: "bg-accent-cyan/10 text-accent-cyan",
  DELIVERED: "bg-primary/10 text-primary",
  COMPLETED: "bg-primary/20 text-primary",
  DISPUTED: "bg-error/10 text-error",
  CANCELLED: "bg-error/20 text-error",
};

export function ContractView({ contract }: { contract: ContractWithDetails }) {
  const t = useTranslations("contract");
  const terms = contract.terms as Record<string, string>;

  const statusLabel = t(`status${contract.status}` as Parameters<typeof t>[0]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle>{contract.title}</CardTitle>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[contract.status] ?? ""}`}>
            {statusLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-on-surface-variant">{t("client")}</p>
            <p className="font-medium text-on-surface">{contract.client.name ?? "Anonymous"}</p>
          </div>
          <div>
            <p className="text-on-surface-variant">{t("developer")}</p>
            <p className="font-medium text-on-surface">{contract.developer.name ?? "Anonymous"}</p>
          </div>
          <div>
            <p className="text-on-surface-variant">{t("amount")}</p>
            <p className="font-medium text-on-surface">
              {contract.currency === "CNY" ? "\u00A5" : "$"}
              {Number(contract.totalAmount).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-on-surface-variant">{t("signed")}</p>
            <p className="font-medium text-on-surface">
              {t("clientSigned", { status: contract.signedByClient ? t("signedYes") : t("signedNo") })}
              {" / "}
              {t("devSigned", { status: contract.signedByDeveloper ? t("signedYes") : t("signedNo") })}
            </p>
          </div>
        </div>

        {Object.entries(terms).map(([key, value]) => (
          <div key={key}>
            <h4 className="text-sm font-semibold text-on-surface capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </h4>
            <p className="mt-1 text-sm text-on-surface-variant">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
