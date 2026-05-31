'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { TransactionSchema } from '@/lib/validations'

type TransactionFormValues = z.infer<typeof TransactionSchema>

type TransactionFormProps = {
  onSubmit: (values: TransactionFormValues) => Promise<void>
  isSubmitting?: boolean
}

export default function TransactionForm({ onSubmit, isSubmitting = false }: TransactionFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(TransactionSchema),
    defaultValues: {
      status: 'PENDING',
    },
  })

  const status = watch('status')

  async function handleFormSubmit(values: TransactionFormValues) {
    await onSubmit(values)
    reset({ status: 'PENDING' })
  }

  return (
    <form
      className="space-y-4 rounded-2xl md:border md:border-border md:bg-card md:p-6 md:shadow-sm"
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          Buyer Name
          <input
            className="rounded-xl border border-border px-3 py-2"
            {...register('buyerName')}
            placeholder="Buyer name"
          />
          {errors.buyerName ? <span className="text-xs text-status-cancelled">{errors.buyerName.message}</span> : null}
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Payment Method
          <input
            className="rounded-xl border border-border px-3 py-2"
            {...register('paymentMethod')}
            placeholder="Bank Transfer"
          />
          {errors.paymentMethod ? (
            <span className="text-xs text-status-cancelled">{errors.paymentMethod.message}</span>
          ) : null}
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm">
        Items Purchased
        <textarea
          className="min-h-[90px] rounded-xl border border-border px-3 py-2"
          {...register('items')}
          placeholder="Describe items sold"
        />
        {errors.items ? <span className="text-xs text-status-cancelled">{errors.items.message}</span> : null}
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm">
          Amount
          <input
            type="number"
            step="0.01"
            className="rounded-xl border border-border px-3 py-2"
            {...register('amount', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.amount ? <span className="text-xs text-status-cancelled">{errors.amount.message}</span> : null}
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Status
          <select className="rounded-xl border border-border px-3 py-2" {...register('status')}>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        {status === 'PENDING' ? (
          <label className="flex flex-col gap-2 text-sm">
            Phone Number
            <input
              className="rounded-xl border border-border px-3 py-2"
              {...register('buyerPhone')}
              placeholder="07xxxxxxxx"
            />
            {errors.buyerPhone ? (
              <span className="text-xs text-status-cancelled">{errors.buyerPhone.message}</span>
            ) : null}
          </label>
        ) : null}
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Add Transaction'}
      </button>
    </form>
  )
}
