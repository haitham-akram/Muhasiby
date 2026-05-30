export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 flex-col border-r border-border bg-card px-6 py-8 lg:flex">
        <div className="text-lg font-semibold">Cashier Ledger</div>
        <nav className="mt-10 flex flex-col gap-3 text-sm text-text-secondary">
          <span className="text-text-primary">Today</span>
          <span>Summary</span>
          <span>History</span>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <span className="text-sm text-text-secondary">Daily dashboard</span>
          <button className="rounded-xl bg-black px-4 py-2 text-sm text-white">
            Logout
          </button>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
