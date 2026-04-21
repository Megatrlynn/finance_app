import type { Transaction } from '../../types'
import { formatCurrency } from '../../lib/finance'
import { Plus } from 'lucide-react'

interface TransactionsTabProps {
  transactions: Transaction[]
  onAdd: () => void
}

export function TransactionsTab({ transactions, onAdd }: TransactionsTabProps) {
  return (
    <section className="grid gap-3 lg:grid-cols-[1fr]">
      <article className="rounded-3xl border border-slate-300 bg-white/85 p-4 shadow-lg backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">Transactions</h2>
          <button
            type="button"
            onClick={onAdd}
            className="hidden items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white md:inline-flex"
          >
            <Plus size={16} /> Add Transaction
          </button>
        </div>

        <div className="space-y-2">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                <div>
                  <p className="font-semibold text-slate-800">{transaction.category}</p>
                  <p className="text-xs text-slate-500">{transaction.note || 'No note'}</p>
                </div>
                <div className={transaction.kind === 'income' ? 'font-bold text-emerald-600' : 'font-bold text-slate-700'}>
                  {transaction.kind === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-4 text-sm text-slate-500">
              No transactions match your current search and filters.
            </p>
          )}
        </div>
      </article>
    </section>
  )
}
