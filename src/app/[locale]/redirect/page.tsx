import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { UserRole } from "@prisma/client";

export default async function RedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ activeRole?: string }>;
}) {
  const [session, locale] = await Promise.all([auth(), getLocale()]);

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const { activeRole: requestedRole } = await searchParams;

  if (requestedRole === "CLIENT" || requestedRole === "DEVELOPER") {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true, createdAt: true },
    });
    const isFreshSignup =
      user?.createdAt &&
      Date.now() - new Date(user.createdAt).getTime() < 60_000;
    if (isFreshSignup && user.roles.includes(requestedRole as UserRole)) {
      await db.user.update({
        where: { id: session.user.id },
        data: { activeRole: requestedRole as UserRole },
      });
      redirect(
        requestedRole === "DEVELOPER"
          ? `/${locale}/dashboard/developer`
          : `/${locale}/dashboard/client`
      );
    }
  }

  redirect(
    session.user.role === "DEVELOPER"
      ? `/${locale}/dashboard/developer`
      : `/${locale}/dashboard/client`
  );
}
