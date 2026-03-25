"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signContract, transitionContract } from "@/lib/actions/contract";

interface Props {
  contractId: string;
  status: string;
  isClient: boolean;
  isDeveloper: boolean;
  signedByClient: boolean;
  signedByDeveloper: boolean;
}

export function ContractActions({
  contractId,
  status,
  isClient,
  isDeveloper,
  signedByClient,
  signedByDeveloper,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleSign() {
    setLoading(true);
    await signContract(contractId);
    window.location.reload();
  }

  async function handleTransition(newStatus: string) {
    setLoading(true);
    await transitionContract(contractId, newStatus);
    window.location.reload();
  }

  async function handlePay() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
    setLoading(false);
  }

  const canSign =
    (status === "DRAFT" || status === "PENDING_SIGN") &&
    ((isClient && !signedByClient) || (isDeveloper && !signedByDeveloper));
  const canPay = status === "ACTIVE" && isClient;
  const canAccept = status === "DELIVERED" && isClient;
  const canRequestRevision = status === "DELIVERED" && isClient;
  const canDispute =
    (status === "ACTIVE" || status === "DELIVERED") && (isClient || isDeveloper);

  return (
    <div className="flex flex-wrap gap-2">
      {canSign && (
        <Button onClick={handleSign} disabled={loading}>Sign Contract</Button>
      )}
      {canPay && (
        <Button onClick={handlePay} disabled={loading}>Pay (Escrow)</Button>
      )}
      {canAccept && (
        <Button onClick={() => handleTransition("COMPLETED")} disabled={loading}>
          Accept & Release Payment
        </Button>
      )}
      {canRequestRevision && (
        <Button variant="secondary" onClick={() => handleTransition("ACTIVE")} disabled={loading}>
          Request Revision
        </Button>
      )}
      {canDispute && (
        <Button variant="destructive" onClick={() => handleTransition("DISPUTED")} disabled={loading}>
          Dispute
        </Button>
      )}
    </div>
  );
}
