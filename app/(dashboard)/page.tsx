export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-6 py-10">
        <h1 className="text-3xl font-semibold">Today&apos;s Session</h1>
        <p className="text-text-secondary">
          Open a session to start recording today&apos;s sales.
        </p>
      </main>
    </div>
  );
}
