import { Nav } from "@/components/nav";
import { ClientSidebar } from "@/components/dashboard/client-sidebar";
import { clientSidebarLinks } from "@/components/dashboard/client-sidebar-links";
import { getTranslations } from "next-intl/server";

export default async function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("clientSidebar");

  const dashboardLinks = clientSidebarLinks.map((link) => ({
    href: link.href,
    label: t(link.labelKey),
  }));

  return (
    <>
      <Nav dashboardLinks={dashboardLinks} />
      <div className="mx-auto flex max-w-screen-2xl flex-1 gap-10 px-4 py-6 md:px-6 md:py-12 lg:px-16">
        <ClientSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
