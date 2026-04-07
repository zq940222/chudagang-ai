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