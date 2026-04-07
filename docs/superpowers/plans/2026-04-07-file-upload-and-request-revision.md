# File Upload and Request Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement private file uploads for contract deliverables via Supabase Storage presigned URLs, and add a "Request Revision" workflow to reject deliverables.

**Architecture:** 
1. **Upload:** Client requests a presigned URL from `/api/upload/presign`, uploads directly to Supabase Storage, and submits the object path to the `submitDelivery` Server Action.
2. **Download:** Client requests a signed URL from `/api/download` using the object path to view private files.
3. **Revision:** Client submits a `reviewComment` via a new `requestRevision` Server Action, which reverts the contract status from `DELIVERED` to `ACTIVE` and marks the latest deliverable as `REJECTED`.

**Tech Stack:** Next.js App Router, React Server Components, Tailwind CSS, Prisma, Supabase Storage (supabase-js), next-intl

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/supabase/admin.ts` | Create | Supabase admin client for signing URLs (bypassing RLS) |
| `src/app/api/upload/presign/route.ts` | Create | API route to generate presigned PUT URLs |
| `src/app/api/download/route.ts` | Create | API route to generate signed GET URLs |
| `src/lib/actions/contract.ts` | Modify | Add `requestRevision` Server Action |
| `src/components/delivery/delivery-form.tsx` | Modify | Replace text input with file upload logic |
| `src/components/delivery/deliverable-review.tsx` | Modify | Update download link, add "Request Revision" UI |
| `src/components/delivery/revision-dialog.tsx` | Create | Client component for the revision request modal |

---

### Task 1: Setup Supabase Admin Client

**Files:**
- Create: `src/lib/supabase/admin.ts`

- [ ] **Step 1: Create the Supabase admin client**

```typescript
import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

// Admin client bypasses RLS. Never expose this to the browser.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase/admin.ts
git commit -m "chore: add supabase admin client for storage signing"
```

---

### Task 2: Implement Upload Presign API

**Files:**
- Create: `src/app/api/upload/presign/route.ts`

- [ ] **Step 1: Create the API route for presigned URLs**

```typescript
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    const contractId = searchParams.get("contractId");

    if (!filename || !contractId) {
      return new NextResponse("Missing filename or contractId", { status: 400 });
    }

    // Verify user is the developer on this contract
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      select: { developerId: true },
    });

    if (!contract || contract.developerId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Clean filename and generate unique path
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const objectPath = `contracts/${contractId}/${uuidv4()}-${safeFilename}`;

    // Generate presigned PUT URL valid for 15 minutes (900 seconds)
    const { data, error } = await supabaseAdmin.storage
      .from("deliverables")
      .createSignedUploadUrl(objectPath);

    if (error) {
      console.error("Supabase signing error:", error);
      return new NextResponse("Failed to generate upload URL", { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      objectPath: data.path,
    });
  } catch (error) {
    console.error("Presign API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/upload/presign/route.ts
git commit -m "feat: add api route for generating presigned upload urls"
```

---

### Task 3: Implement Download Signed URL API

**Files:**
- Create: `src/app/api/download/route.ts`

- [ ] **Step 1: Create the API route for secure downloads**

```typescript
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const contractId = searchParams.get("contractId");

    if (!path || !contractId) {
      return new NextResponse("Missing path or contractId", { status: 400 });
    }

    // Verify user is either client or developer on this contract
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      select: { clientId: true, developerId: true },
    });

    if (
      !contract ||
      (contract.clientId !== session.user.id &&
        contract.developerId !== session.user.id)
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Ensure the requested path actually belongs to this contract
    if (!path.startsWith(`contracts/${contractId}/`)) {
      return new NextResponse("Invalid path for this contract", { status: 400 });
    }

    // Generate signed GET URL valid for 60 seconds
    const { data, error } = await supabaseAdmin.storage
      .from("deliverables")
      .createSignedUrl(path, 60, { download: true });

    if (error) {
      console.error("Supabase download signing error:", error);
      return new NextResponse("Failed to generate download URL", { status: 500 });
    }

    // Redirect directly to the signed URL
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error("Download API Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/download/route.ts
git commit -m "feat: add api route for generating signed download urls"
```

---

### Task 4: Server Action for Request Revision

**Files:**
- Modify: `src/lib/actions/contract.ts`

- [ ] **Step 1: Add `requestRevision` action**

Add this to `src/lib/actions/contract.ts` (alongside existing actions):

```typescript
export async function requestRevision(
  contractId: string,
  reviewComment: string
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: { deliverables: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!contract || contract.clientId !== session.user.id) {
      return { error: "Contract not found or forbidden" };
    }

    if (contract.status !== "DELIVERED") {
      return { error: "Contract must be in DELIVERED state" };
    }

    const latestDeliverable = contract.deliverables[0];
    if (!latestDeliverable) {
      return { error: "No deliverable found" };
    }

    await db.$transaction([
      // 1. Move contract back to ACTIVE
      db.contract.update({
        where: { id: contractId },
        data: { status: "ACTIVE" },
      }),
      // 2. Mark deliverable as REJECTED and save comment
      db.deliverable.update({
        where: { id: latestDeliverable.id },
        data: {
          status: "REJECTED",
          reviewComment: reviewComment,
        },
      }),
      // 3. Notify developer
      db.notification.create({
        data: {
          userId: contract.developerId,
          type: "CONTRACT_UPDATE",
          title: "Revision Requested",
          body: `The client has requested revisions for contract: ${contract.title}`,
          link: `/dashboard/developer/projects/${contract.id}`,
        },
      }),
    ]);

    revalidatePath(`/dashboard/client/projects/${contractId}`);
    revalidatePath(`/dashboard/developer/projects/${contractId}`);
    return { success: true };
  } catch (error) {
    console.error("requestRevision error:", error);
    return { error: "Failed to request revision" };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/contract.ts
git commit -m "feat: add requestRevision server action"
```

---

### Task 5: Upgrade Delivery Form for Real Uploads

**Files:**
- Modify: `src/components/delivery/delivery-form.tsx`

- [ ] **Step 1: Replace text input with file upload logic**

In `src/components/delivery/delivery-form.tsx`, replace the component logic to handle file selection, fetch presigned URL, and upload.

*Note: Since the file is large, I'll provide the core changes needed.*

Add states:
```typescript
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
```

Update `onSubmit`:
```typescript
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      toast.error(t("fileRequired"));
      return;
    }

    setUploading(true);
    setUploadProgress(10); // Start progress

    try {
      // 1. Get presigned URL
      const presignRes = await fetch(
        `/api/upload/presign?filename=${encodeURIComponent(
          file.name
        )}&contractId=${contractId}`
      );
      
      if (!presignRes.ok) {
        throw new Error("Failed to get upload URL");
      }
      
      const { signedUrl, objectPath } = await presignRes.json();
      setUploadProgress(40);

      // 2. Upload file directly to Supabase
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }
      
      setUploadProgress(90);

      // 3. Submit form data with object path
      const formData = new FormData(e.currentTarget);
      formData.set("fileUrl", objectPath); // Store object path instead of actual URL
      
      const result = await submitDelivery(formData);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("success"));
        setIsOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(t("uploadError") || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }
```

Update the form JSX:
```tsx
            <div>
              <Label htmlFor="fileUrl">{t("fileUrl")}</Label>
              <Input
                id="fileUrl"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={uploading}
                className="mt-1"
                required
              />
              {uploading && (
                <div className="mt-2 h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent-cyan transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/delivery/delivery-form.tsx
git commit -m "feat: implement real file upload via presigned urls in delivery form"
```

---

### Task 6: Upgrade Deliverable Review UI

**Files:**
- Create: `src/components/delivery/revision-dialog.tsx`
- Modify: `src/components/delivery/deliverable-review.tsx`

- [ ] **Step 1: Create RevisionDialog component**

Create `src/components/delivery/revision-dialog.tsx`:

```tsx
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
```

- [ ] **Step 2: Update `deliverable-review.tsx`**

Modify `src/components/delivery/deliverable-review.tsx`:

1. Update the `fileUrl` link to use the download API.
2. Add the `RevisionDialog` for clients when status is `PENDING_REVIEW` (meaning contract is `DELIVERED`).

```tsx
import { RevisionDialog } from "./revision-dialog";
// ...
export function DeliverableReview({ 
  contractId, // Need to pass this down now
  deliverableId, 
  title, 
  description, 
  fileUrl, 
  status,
  isClient,
  locale = "en"
}: Props & { contractId: string, isClient?: boolean, locale?: string }) {
  
  // Replace the old fileUrl <a> tag with:
  {fileUrl && (
    <a 
      href={`/api/download?path=${encodeURIComponent(fileUrl)}&contractId=${contractId}`} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="mt-2 inline-block text-xs text-accent-cyan underline"
    >
      Download Attachment
    </a>
  )}

  // Add at the bottom of the card, next to Accept button (if you have one here, or just render it):
  {isClient && status === "PENDING_REVIEW" && (
    <div className="mt-4 flex gap-3 border-t border-white/5 pt-4">
      {/* Assuming Accept button is elsewhere or you can add it here */}
      <RevisionDialog contractId={contractId} locale={locale} />
    </div>
  )}
```
*(Note: You will need to update the parent component `src/app/[locale]/dashboard/client/projects/[id]/page.tsx` to pass `contractId={contract.id}`, `isClient={true}`, and `locale={locale}` to `<DeliverableReview>`)*

- [ ] **Step 3: Commit**

```bash
git add src/components/delivery/revision-dialog.tsx src/components/delivery/deliverable-review.tsx
git commit -m "feat: add request revision ui and secure download links"
```
