import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MonthSeriesItem } from '../../lib/insights'
import { AnimatedTooltip } from './AnimatedTooltip'

interface MonthlyAreaChartCardProps {
  monthlySeries: MonthSeriesItem[]
}

export function MonthlyAreaChartCard({ monthlySeries }: MonthlyAreaChartCardProps) {
  return (
    <article className="rounded-3xl border border-slate-300 bg-white/85 p-4 shadow-lg backdrop-blur-xl">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Growth Trend</p>
        <h2 className="text-xl font-bold text-slate-900">Income vs Expenses (6 months)</h2>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlySeries} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fill: 'var(--chart-axis)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--chart-axis)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<AnimatedTooltip />} cursor={{ stroke: 'var(--chart-cursor)', strokeOpacity: 0.4 }} />
            <Area
              type="monotone"
              dataKey="income"
              stroke="var(--chart-income)"
              fill="var(--chart-income)"
              fillOpacity={0.2}
              strokeWidth={2}
              isAnimationActive
              animationDuration={900}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="var(--chart-expense)"
              fill="var(--chart-expense)"
              fillOpacity={0.16}
              strokeWidth={2}
              isAnimationActive
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}
