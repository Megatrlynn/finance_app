import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { IncomeExpenseSlice } from '../../lib/insights'
import { AnimatedTooltip } from './AnimatedTooltip'

interface IncomeExpensePieCardProps {
  incomeExpenseSplit: IncomeExpenseSlice[]
}

const pieColors = ['var(--chart-income)', 'var(--chart-expense)']

const pieColorAt = (index: number): string => pieColors[index % pieColors.length] ?? 'var(--chart-income)'

export function IncomeExpensePieCard({ incomeExpenseSplit }: IncomeExpensePieCardProps) {
  return (
    <article className="rounded-3xl border border-slate-300 bg-white/85 p-4 shadow-lg backdrop-blur-xl lg:col-span-2">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Ratio View</p>
        <h2 className="text-xl font-bold text-slate-900">Income vs Expense Pie</h2>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<AnimatedTooltip />} />
            <Pie
              data={incomeExpenseSplit}
              dataKey="value"
              nameKey="name"
              outerRadius={104}
              isAnimationActive
              animationDuration={850}
              stroke="none"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {incomeExpenseSplit.map((_, index) => (
                <Cell key={`income-expense-${index}`} fill={pieColorAt(index)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}
