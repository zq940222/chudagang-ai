import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
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
    const { data, error } = await getSupabaseAdmin().storage
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
