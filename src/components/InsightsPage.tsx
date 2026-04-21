import { motion } from 'framer-motion'
import { lazy, Suspense } from 'react'
import type {
  CategorySeriesItem,
  IncomeExpenseSlice,
  MonthSeriesItem,
} from '../lib/insights'

interface InsightsPageProps {
  monthlySeries: MonthSeriesItem[]
  spendingByCategory: CategorySeriesItem[]
  totalSpending: number
  incomeExpenseSplit: IncomeExpenseSlice[]
}

const LazyMonthlyAreaChartCard = lazy(() =>
  import('./insights/MonthlyAreaChartCard').then((module) => ({ default: module.MonthlyAreaChartCard })),
)
const LazyCategoryDonutCard = lazy(() =>
  import('./insights/CategoryDonutCard').then((module) => ({ default: module.CategoryDonutCard })),
)
const LazyIncomeExpensePieCard = lazy(() =>
  import('./insights/IncomeExpensePieCard').then((module) => ({ default: module.IncomeExpensePieCard })),
)

function CardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <article className={`rounded-3xl border border-slate-300 bg-white/85 p-4 shadow-lg backdrop-blur-xl ${tall ? 'lg:col-span-2' : ''}`}>
      <div className="h-72 w-full animate-pulse rounded-2xl bg-slate-100" />
    </article>
  )
}

export function InsightsPage({
  monthlySeries,
  spendingByCategory,
  totalSpending,
  incomeExpenseSplit,
}: InsightsPageProps) {
  return (
    <motion.section
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.28, ease: 'easeInOut' }}
      className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]"
    >
      <Suspense fallback={<CardSkeleton />}>
        <LazyMonthlyAreaChartCard monthlySeries={monthlySeries} />
      </Suspense>

      <Suspense fallback={<CardSkeleton />}>
        <LazyCategoryDonutCard spendingByCategory={spendingByCategory} totalSpending={totalSpending} />
      </Suspense>

      <Suspense fallback={<CardSkeleton tall />}>
        <LazyIncomeExpensePieCard incomeExpenseSplit={incomeExpenseSplit} />
      </Suspense>
    </motion.section>
  )
}
