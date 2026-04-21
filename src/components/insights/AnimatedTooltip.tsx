import { motion } from 'framer-motion'
import { formatCurrency } from '../../lib/finance'

interface CustomTooltipPayloadItem {
  name?: string
  value?: number
  color?: string
}

interface CustomTooltipProps {
  active?: boolean
  label?: string
  payload?: CustomTooltipPayloadItem[]
}

export function AnimatedTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl"
    >
      {label ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p> : null}
      <div className="mt-1 space-y-1">
        {payload.map((item) => (
          <div key={`${item.name}-${item.value}`} className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-slate-700">{item.name}</span>
            <span className="font-semibold" style={{ color: item.color ?? 'var(--chart-label)' }}>
              {formatCurrency(item.value ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
