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
    <div className="-mx-4 -mt-8 sm:-mx-6 lg:-mx-8">
      {/* Hero chat section — matches find-experts layout */}
      <section className="border-b border-outline-variant/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.56),rgba(246,242,236,0.36))]">
        <div className="mx-auto max-w-4xl px-6 py-8 lg:px-12 lg:py-10">
          <div className="mb-6 text-center">
            <div className="mb-3 flex flex-wrap items-center justify-center gap-3">
              <Badge variant="accent">{t("badge")}</Badge>
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-on-surface sm:text-4xl">
              {t("pageTitle")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant max-w-xl mx-auto">
              {t("pageDesc")}
            </p>
          </div>
          <div className="h-[420px] rounded-2xl glass ghost-border overflow-hidden">
            <ProjectPublishChat />
          </div>
        </div>
      </section>
    </div>
  );
}
