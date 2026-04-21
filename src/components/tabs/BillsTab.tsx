import { Pencil, Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../lib/finance'
import type { RecurringBill } from '../../types'

interface BillsTabProps {
  bills: RecurringBill[]
  onAdd: () => void
  onEdit: (bill: RecurringBill) => void
  onDelete: (bill: RecurringBill) => void
}

export function BillsTab({ bills, onAdd, onEdit, onDelete }: BillsTabProps) {
  return (
    <section className="grid gap-3 lg:grid-cols-[1fr]">
      <article className="rounded-3xl border border-slate-300 bg-white/85 p-4 shadow-lg backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">Recurring Bills</h2>
          <button
            type="button"
            onClick={onAdd}
            className="hidden items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white md:inline-flex"
          >
            <Plus size={16} /> Add Bill
          </button>
        </div>

        <div className="space-y-2">
          {bills.length > 0 ? (
            bills.map((bill) => (
              <div key={bill.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800">{bill.title}</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(bill.amount)}</p>
                </div>
                <div className="mb-1 mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(bill)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(bill)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
                <p className="text-sm text-slate-500">Due day {bill.dueDay} · {bill.frequency}</p>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-4 text-sm text-slate-500">
              No recurring bills match your current search and filters.
            </p>
          )}
        </div>
      </article>
    </section>
  )
}
