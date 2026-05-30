import LogoutButton from "@/components/LogoutButton";
import SidebarNav from "@/components/SidebarNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 flex-col border-r border-border bg-card px-6 py-8 lg:flex">
        <div className="text-lg font-semibold">Cashier Ledger</div>
        <SidebarNav />
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <span className="text-sm text-text-secondary">Daily dashboard</span>
          <LogoutButton />
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
