export default function LoginPage() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-text-secondary">
          Access your daily cashier ledger.
        </p>
      </div>
      <form className="space-y-4">
        <label className="flex flex-col gap-2 text-sm">
          Email
          <input
            type="email"
            name="email"
            className="rounded-xl border border-border px-3 py-2"
            placeholder="cashier@example.com"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Password
          <input
            type="password"
            name="password"
            className="rounded-xl border border-border px-3 py-2"
            placeholder="••••••••"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
