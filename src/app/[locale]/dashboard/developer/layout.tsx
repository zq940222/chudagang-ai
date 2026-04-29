import { Nav } from "@/components/nav";
import { DeveloperSidebar } from "@/components/dashboard/developer-sidebar";
import { developerSidebarLinks } from "@/components/dashboard/developer-sidebar-links";
import { getTranslations } from "next-intl/server";

export default async function DeveloperDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("devSidebar");

  const dashboardLinks = developerSidebarLinks.map((link) => ({
    href: link.href,
    label: t(link.labelKey),
  }));

  return (
    <>
      <Nav dashboardLinks={dashboardLinks} />
      <div className="mx-auto flex max-w-screen-2xl flex-1 gap-10 px-4 py-6 md:px-6 md:py-12 lg:px-16 min-h-[calc(100dvh-5rem)] items-start">
        <DeveloperSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
