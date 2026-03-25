import { Nav } from "@/components/nav";
import { ClientSidebar } from "@/components/dashboard/client-sidebar";

export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <div className="mx-auto flex max-w-7xl flex-1 gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <ClientSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
