import CashiersClient from '@/components/CashiersClient'

export default function CashiersPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="mb-4">
        <h1 className="text-3xl font-semibold">Manage Cashiers</h1>
        <p className="text-sm text-text-secondary">Add, edit, or remove cashiers from the system.</p>
      </div>
      <CashiersClient />
    </div>
  )
}
