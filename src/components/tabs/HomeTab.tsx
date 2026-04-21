import { motion } from 'framer-motion'
import { MiniSparkline } from '../MiniSparkline'
import { formatCurrency } from '../../lib/finance'
import type { Transaction } from '../../types'

interface SparkPoint {
  label: string
  value: number
}

interface HomeCard {
  title: string
  value: number
  spark: SparkPoint[]
  positive: boolean
}

interface HomeTabProps {
  cards: HomeCard[]
  recentTransactions: Transaction[]
}

export function HomeTab({ cards, recentTransactions }: HomeTabProps) {
  return (
    <section className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <motion.article
            whileHover={{ y: -3 }}
            key={card.title}
            className="rounded-3xl border border-slate-300 bg-white/85 p-4 shadow-lg backdrop-blur-xl"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{card.title}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className={card.positive ? 'text-2xl font-extrabold text-emerald-600' : 'text-2xl font-extrabold text-slate-800'}>
                {formatCurrency(card.value)}
              </p>
              <MiniSparkline data={card.spark} stroke={card.positive ? 'var(--spark-positive)' : 'var(--spark-neutral)'} />
            </div>
          </motion.article>
        ))}
      </div>

      <article className="rounded-3xl border border-slate-300 bg-white/85 p-4 shadow-lg backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Top 5</span>
        </div>

        <div className="space-y-2">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
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
            <p className="text-sm text-slate-500">No transactions yet.</p>
          )}
        </div>
      </article>
    </section>
  )
}
