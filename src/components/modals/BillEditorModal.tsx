import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { BillFrequency } from '../../types'

interface BillEditorModalProps {
  open: boolean
  title: string
  amount: string
  dueDay: string
  frequency: BillFrequency
  onChangeTitle: (value: string) => void
  onChangeAmount: (value: string) => void
  onChangeDueDay: (value: string) => void
  onChangeFrequency: (value: BillFrequency) => void
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
}

export function BillEditorModal({
  open,
  title,
  amount,
  dueDay,
  frequency,
  onChangeTitle,
  onChangeAmount,
  onChangeDueDay,
  onChangeFrequency,
  onClose,
  onSubmit,
}: BillEditorModalProps) {
  if (!open) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-3"
      onClick={onClose}
    >
      <motion.section
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        className="w-full max-w-xl rounded-3xl border border-slate-300 bg-white p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-slate-900">Edit Recurring Bill</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            required
            value={title}
            onChange={(event) => onChangeTitle(event.target.value)}
            placeholder="Bill title"
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          <input
            required
            type="number"
            min={0.01}
            step="0.01"
            value={amount}
            onChange={(event) => onChangeAmount(event.target.value)}
            placeholder="Amount"
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          <input
            required
            type="number"
            min={1}
            max={31}
            value={dueDay}
            onChange={(event) => onChangeDueDay(event.target.value)}
            placeholder="Due day"
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />

          <div className="grid grid-cols-3 gap-2">
            {(['weekly', 'monthly', 'yearly'] as BillFrequency[]).map((mode) => (
              <motion.button
                whileTap={{ scale: 0.97 }}
                key={mode}
                type="button"
                onClick={() => onChangeFrequency(mode)}
                className={
                  frequency === mode
                    ? 'rounded-xl bg-emerald-500 px-2 py-2 text-xs font-semibold text-white'
                    : 'rounded-xl border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700'
                }
              >
                {mode}
              </motion.button>
            ))}
          </div>

          <button type="submit" className="h-12 w-full rounded-2xl bg-emerald-500 text-sm font-semibold text-white">
            Save Changes
          </button>
        </form>
      </motion.section>
    </motion.div>
  )
}
