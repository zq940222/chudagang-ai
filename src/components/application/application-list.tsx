"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateApplicationStatus } from "@/lib/actions/application";
import { createContractFromApplication } from "@/lib/actions/contract";
import type { ApplicationCardData } from "@/types/contract";

interface Props {
  applications: ApplicationCardData[];
  isOwner: boolean;
}

export function ApplicationList({ applications, isOwner }: Props) {
  const t = useTranslations("application");
  const [items, setItems] = useState(applications);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(
    appId: string,
    action: "ACCEPTED" | "REJECTED" | "contract"
  ) {
    setLoading(appId);

    if (action === "contract") {
      const result = await createContractFromApplication(appId);
      if (!result.error) {
        setItems((prev) =>
          prev.map((a) =>
            a.id === appId ? { ...a, status: "CONTRACT_CREATED" } : a
          )
        );
      }
    } else {
      const result = await updateApplicationStatus({
        applicationId: appId,
        status: action,
      });
      if (!result.error) {
        setItems((prev) =>
          prev.map((a) =>
            a.id === appId ? { ...a, status: action } : a
          )
        );
      }
    }

    setLoading(null);
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant py-4">{t("noApplications")}</p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((app) => (
        <Card key={app.id}>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-on-surface">{app.developerName ?? "Anonymous"}</p>
                {app.proposedRate && (
                  <p className="text-sm text-on-surface-variant">${app.proposedRate}/hr</p>
                )}
                {app.coverLetter && (
                  <p className="mt-2 text-sm text-on-surface-variant line-clamp-3">{app.coverLetter}</p>
                )}
              </div>
              <span className="text-xs font-medium text-accent-cyan">{app.status}</span>
            </div>

            {isOwner && app.status === "PENDING" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => handleAction(app.id, "ACCEPTED")} disabled={loading === app.id}>
                  {t("accept")}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleAction(app.id, "REJECTED")} disabled={loading === app.id}>
                  {t("reject")}
                </Button>
              </div>
            )}

            {isOwner && app.status === "ACCEPTED" && (
              <div className="mt-3">
                <Button size="sm" onClick={() => handleAction(app.id, "contract")} disabled={loading === app.id}>
                  {t("createContract")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
