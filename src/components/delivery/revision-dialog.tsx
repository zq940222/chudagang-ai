"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { requestRevision } from "@/lib/actions/contract";
import toast from "react-hot-toast";

export function RevisionDialog({ contractId, locale }: { contractId: string, locale: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const comment = formData.get("reviewComment") as string;
    
    if (!comment.trim()) return;

    setLoading(true);
    const result = await requestRevision(contractId, comment);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(locale === "zh" ? "已请求修改" : "Revision requested");
      setIsOpen(false);
    }
  }

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        {locale === "zh" ? "要求修改" : "Request Revision"}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl ghost-border">
        <h3 className="text-lg font-bold mb-4">
          {locale === "zh" ? "要求修改" : "Request Revision"}
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reviewComment">
              {locale === "zh" ? "修改意见" : "Revision Details"}
            </Label>
            <Textarea
              id="reviewComment"
              name="reviewComment"
              rows={4}
              required
              placeholder={locale === "zh" ? "请详细描述需要修改的内容..." : "Detail what needs to be changed..."}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={loading}>
              {locale === "zh" ? "取消" : "Cancel"}
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "..." : (locale === "zh" ? "提交" : "Submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
