# File Upload (Supabase Storage) and Request Revision Design Spec

**Date:** 2026-04-07
**Topic:** file-upload-and-request-revision

## 1. Overview
This spec outlines the implementation of secure, private file uploads for deliverables using Supabase Storage, and the implementation of the "Request Revision" workflow to allow clients to reject a delivery and send the contract back to the `ACTIVE` state.

## 2. Architecture & Data Flow

### 2.1 Secure File Uploads (Presigned URLs)
To bypass Vercel's 4.5MB request body limit and ensure files remain private, we will use Supabase Storage with presigned URLs.

1.  **Request Upload URL:** The client-side form requests a presigned upload URL from a new Next.js API route (`/api/upload/presign`).
2.  **Server Validation:** The API route verifies the user's session and generates a unique object path (e.g., `contracts/[contractId]/[uuid]-[filename]`). It uses the Supabase Admin client to generate a presigned `PUT` URL.
3.  **Direct Upload:** The client-side form uses the presigned URL to upload the file directly to Supabase Storage.
4.  **Save Deliverable:** Upon successful upload, the client submits the object path (not the full public URL) to the `submitDelivery` Server Action.

### 2.2 Secure File Downloads
Because the storage bucket is private, files cannot be accessed via direct public URLs.

1.  **Request Download URL:** When a user (Client or Developer) clicks to download a deliverable, the client requests a temporary, signed download URL from a new Next.js API route (`/api/download`).
2.  **Server Validation:** The API route verifies the user's session and ensures they are a party to the contract associated with the deliverable.
3.  **Generate URL:** If authorized, the API uses the Supabase Admin client to generate a signed download URL (valid for e.g., 60 seconds).
4.  **Client Redirect:** The client receives the URL and opens it in a new tab or triggers a download.

### 2.3 Request Revision Workflow
When a contract is in the `DELIVERED` state, the client can either accept the delivery or request a revision.

1.  **UI Addition:** Add a "Request Revision" button to the contract details page for clients when the contract is `DELIVERED`.
2.  **Form Submission:** Clicking the button opens a modal/form to collect a `reviewComment` explaining what needs to be changed.
3.  **Server Action (`requestRevision`):** 
    *   Verifies the user is the client for the contract.
    *   Changes the contract status back from `DELIVERED` to `ACTIVE`.
    *   Updates the latest `Deliverable` record: sets its status to `REJECTED` and saves the `reviewComment`. (As per MVP decision: we overwrite the latest attempt's status rather than keeping a full history log).
    *   Sends a notification to the developer that a revision was requested.
4.  **Re-delivery:** The developer sees the contract is `ACTIVE` again, can read the `reviewComment`, and can submit a new delivery (which creates a new `Deliverable` record or updates the existing one to `PENDING_REVIEW` and moves the contract back to `DELIVERED`).

## 3. Database Changes (Prisma)
No structural schema changes are required. 
*   `Deliverable.fileUrl`: This string field will now store the Supabase Storage object path (e.g., `contracts/c123/uuid-file.zip`) instead of a generic URL.
*   `Deliverable.status`: We will ensure we use values like `PENDING_REVIEW`, `ACCEPTED`, `REJECTED`.
*   `Deliverable.reviewComment`: This existing field will be used to store the client's revision request details.

## 4. API Routes & Server Actions

*   **`GET /api/upload/presign`**: 
    *   Query params: `filename`, `contractId`.
    *   Returns: `{ url: string, path: string }`.
*   **`GET /api/download`**:
    *   Query params: `path`, `contractId`.
    *   Returns: `{ url: string }`.
*   **`requestRevision(contractId: string, reviewComment: string)`** (Server Action):
    *   Updates Contract and Deliverable statuses. Creates a Notification.

## 5. UI Component Updates

*   **`src/components/delivery/delivery-form.tsx`**: Replace the text input for `fileUrl` with a `<input type="file" />`. Implement the 2-step upload logic (get presigned URL -> upload file -> submit form). Add loading states/progress indication.
*   **`src/components/delivery/deliverable-review.tsx`**: 
    *   Change the download link to use the `/api/download` route.
    *   Add the "Request Revision" button and form/modal for clients.

## 6. Environment Variables
Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured in `.env` to allow the server to sign URLs for the private bucket. We also need to create a private bucket named `deliverables` in Supabase.