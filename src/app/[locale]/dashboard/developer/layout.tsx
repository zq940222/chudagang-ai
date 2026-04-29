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
    <div className="flex h-dvh flex-col overflow-hidden">
      <Nav dashboardLinks={dashboardLinks} />
      {/* flex-1 + overflow-hidden: fills remaining height, no viewport scroll */}
      <div className="mx-auto flex w-full max-w-screen-2xl flex-1 gap-10 overflow-hidden px-4 md:px-6 lg:px-16">
        <DeveloperSidebar />
        {/* only this area scrolls independently */}
        <main className="min-w-0 flex-1 overflow-y-auto py-6 md:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
