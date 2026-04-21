import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface BudgetEditorModalProps {
  open: boolean
  category: string
  limit: string
  onChangeCategory: (value: string) => void
  onChangeLimit: (value: string) => void
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
}

export function BudgetEditorModal({
  open,
  category,
  limit,
  onChangeCategory,
  onChangeLimit,
  onClose,
  onSubmit,
}: BudgetEditorModalProps) {
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
          <h3 className="text-xl font-bold text-slate-900">Edit Budget</h3>
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
            value={category}
            onChange={(event) => onChangeCategory(event.target.value)}
            placeholder="Category"
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          <input
            required
            type="number"
            min={0.01}
            step="0.01"
            value={limit}
            onChange={(event) => onChangeLimit(event.target.value)}
            placeholder="Budget limit"
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          <button type="submit" className="h-12 w-full rounded-2xl bg-emerald-500 text-sm font-semibold text-white">
            Save Changes
          </button>
        </form>
      </motion.section>
    </motion.div>
  )
}
