"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { applyToProject } from "@/lib/actions/application";

export function ApplicationForm({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await applyToProject({
      projectId,
      coverLetter: formData.get("coverLetter") as string || undefined,
      proposedRate: formData.get("proposedRate")
        ? Number(formData.get("proposedRate"))
        : undefined,
    });

    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Validation error");
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <Card>
        <CardContent>
          <p className="text-accent-cyan font-medium py-4">
            Application submitted successfully!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply to this Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-on-surface">Cover Letter</label>
            <textarea
              name="coverLetter"
              rows={5}
              placeholder="Describe why you're a good fit for this project..."
              className="mt-1 w-full rounded-md bg-surface-container-lowest px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-on-surface">Proposed Rate (USD/hr)</label>
            <Input name="proposedRate" type="number" min={0} step={0.01} placeholder="e.g. 80" className="mt-1" />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
