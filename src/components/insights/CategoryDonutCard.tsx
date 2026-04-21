import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { CategorySeriesItem } from '../../lib/insights'
import { formatCurrency } from '../../lib/finance'
import { AnimatedTooltip } from './AnimatedTooltip'

interface CategoryDonutCardProps {
  spendingByCategory: CategorySeriesItem[]
  totalSpending: number
}

const donutColors = [
  'var(--chart-donut-1)',
  'var(--chart-donut-2)',
  'var(--chart-donut-3)',
  'var(--chart-donut-4)',
  'var(--chart-donut-5)',
  'var(--chart-donut-6)',
]

const donutColorAt = (index: number): string => donutColors[index % donutColors.length] ?? 'var(--chart-donut-1)'

export function CategoryDonutCard({ spendingByCategory, totalSpending }: CategoryDonutCardProps) {
  return (
    <article className="rounded-3xl border border-slate-300 bg-white/85 p-4 shadow-lg backdrop-blur-xl">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Spending Mix</p>
        <h2 className="text-xl font-bold text-slate-900">Category Breakdown</h2>
      </div>

      <div className="relative mx-auto h-72 w-full max-w-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<AnimatedTooltip />} />
            <Pie
              data={spendingByCategory}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={104}
              paddingAngle={3}
              isAnimationActive
              animationDuration={900}
              stroke="none"
            >
              {spendingByCategory.map((_, index) => (
                <Cell key={`cell-${index}`} fill={donutColorAt(index)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Total Spending</p>
            <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(totalSpending)}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {spendingByCategory.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <span className="inline-flex items-center gap-2 text-sm text-slate-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: donutColorAt(index) }} />
              {item.name}
            </span>
            <span className="text-sm font-semibold text-slate-900">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </article>
  )
}
