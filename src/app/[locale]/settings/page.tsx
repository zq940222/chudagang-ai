import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Nav } from "@/components/nav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";

export default async function SettingsPage() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const t = await getTranslations("settings");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, hashedPassword: true },
  });

  if (!user) redirect(`/${locale}/login`);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-12 md:px-6">
        <h1 className="mb-8 text-2xl font-bold text-on-surface">{t("title")}</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("profileSection")}</CardTitle>
              <p className="text-sm text-on-surface-variant">{user.email}</p>
            </CardHeader>
            <CardContent>
              <ProfileForm defaultName={user.name ?? ""} />
            </CardContent>
          </Card>

          {user.hashedPassword && (
            <Card>
              <CardHeader>
                <CardTitle>{t("passwordSection")}</CardTitle>
              </CardHeader>
              <CardContent>
                <PasswordForm />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
