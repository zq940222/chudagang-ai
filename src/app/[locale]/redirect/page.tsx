import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function RedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  redirect(
    session.user.role === "DEVELOPER"
      ? "/dashboard/developer"
      : "/dashboard/client"
  );
}
