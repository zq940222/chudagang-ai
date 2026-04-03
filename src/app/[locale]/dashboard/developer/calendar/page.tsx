import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

export default async function CalendarPage() {
  const session = await auth();
  if (!session) redirect("/en/login");

  const t = await getTranslations("calendar");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-on-surface-variant">
          {t("comingSoon")}
        </p>
      </CardContent>
    </Card>
  );
}
