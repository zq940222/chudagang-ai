import { Nav } from "@/components/nav";
import { DeveloperSidebar } from "@/components/dashboard/developer-sidebar";

export default function DeveloperDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <div className="mx-auto flex max-w-screen-2xl flex-1 gap-10 px-6 py-12 lg:px-16">
        <DeveloperSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
