import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProjectPublishChat } from "@/components/project/project-publish-chat";
import { Badge } from "@/components/ui/badge";

export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/en/login");

  const t = await getTranslations("projectChat");

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 text-center">
        <Badge variant="accent" className="mb-4">{t("badge")}</Badge>
        <h1 className="text-3xl font-black tracking-tighter text-on-surface sm:text-4xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant leading-relaxed max-w-xl mx-auto">
          {t("pageDesc")}
        </p>
      </header>

      <div className="h-[520px] rounded-2xl glass ghost-border overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.56),rgba(246,242,236,0.36))]">
        <ProjectPublishChat />
      </div>
    </div>
  );
}
