import { motion } from 'framer-motion'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../lib/finance'
import type { Budget } from '../../types'

interface BudgetsTabProps {
  budgets: Budget[]
  onAdd: () => void
  onEdit: (budget: Budget) => void
  onDelete: (budget: Budget) => void
}

export function BudgetsTab({ budgets, onAdd, onEdit, onDelete }: BudgetsTabProps) {
  return (
    <section className="grid gap-3 lg:grid-cols-[1fr]">
      <article className="rounded-3xl border border-slate-300 bg-white/85 p-4 shadow-lg backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">Budgets</h2>
          <button
            type="button"
            onClick={onAdd}
            className="hidden items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white md:inline-flex"
          >
            <Plus size={16} /> Add Budget
          </button>
        </div>

        <div className="space-y-2">
          {budgets.length > 0 ? (
            budgets.map((budget) => {
              const left = budget.limit - budget.spent
              const percentage = Math.min(100, Math.max(0, (budget.spent / budget.limit) * 100))

              return (
                <article key={budget.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold text-slate-800">{budget.category}</p>
                    <p className={left >= 0 ? 'text-sm text-emerald-700' : 'text-sm text-slate-700'}>
                      {formatCurrency(left)} left
                    </p>
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(budget)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(budget)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.45 }}
                      className="block h-full bg-emerald-500"
                    />
                  </div>
                </article>
              )
            })
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-4 text-sm text-slate-500">
              No budgets match your current search and filters.
            </p>
          )}
        </div>
      </article>
    </section>
  )
}
