import { motion } from 'framer-motion'
import {
  Briefcase,
  Bus,
  Clapperboard,
  HeartPulse,
  ShoppingBag,
  UtensilsCrossed,
  WalletCards,
  X,
} from 'lucide-react'
import { CategoryDropdown, type CategoryOption } from '../CategoryDropdown'
import type { BillFrequency, TransactionKind } from '../../types'

type FormModal = 'transaction' | 'budget' | 'pot' | 'bill' | null

interface TransactionFormState {
  kind: TransactionKind
  amount: string
  category: string
  note: string
  date: string
}

interface BudgetFormState {
  category: string
  limit: string
}

interface PotFormState {
  name: string
  target: string
  current: string
}

interface BillFormState {
  title: string
  amount: string
  dueDay: string
  frequency: BillFrequency
}

interface FinanceFormModalProps {
  activeModal: FormModal
  onClose: () => void
  transactionForm: TransactionFormState
  setTransactionForm: React.Dispatch<React.SetStateAction<TransactionFormState>>
  budgetForm: BudgetFormState
  setBudgetForm: React.Dispatch<React.SetStateAction<BudgetFormState>>
  potForm: PotFormState
  setPotForm: React.Dispatch<React.SetStateAction<PotFormState>>
  billForm: BillFormState
  setBillForm: React.Dispatch<React.SetStateAction<BillFormState>>
  onSubmitTransaction: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
  onSubmitBudget: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
  onSubmitPot: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
  onSubmitBill: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
}

const categoryOptions: CategoryOption[] = [
  { value: 'Food', label: 'Food', icon: UtensilsCrossed },
  { value: 'Transport', label: 'Transport', icon: Bus },
  { value: 'Health', label: 'Health', icon: HeartPulse },
  { value: 'Entertainment', label: 'Entertainment', icon: Clapperboard },
  { value: 'Shopping', label: 'Shopping', icon: ShoppingBag },
  { value: 'Salary', label: 'Salary', icon: Briefcase },
  { value: 'Other', label: 'Other', icon: WalletCards },
]

export function FinanceFormModal({
  activeModal,
  onClose,
  transactionForm,
  setTransactionForm,
  budgetForm,
  setBudgetForm,
  potForm,
  setPotForm,
  billForm,
  setBillForm,
  onSubmitTransaction,
  onSubmitBudget,
  onSubmitPot,
  onSubmitBill,
}: FinanceFormModalProps) {
  if (!activeModal) {
    return null
  }

  const modalTitle =
    activeModal === 'transaction'
      ? 'Add Transaction'
      : activeModal === 'budget'
        ? 'Create Budget'
        : activeModal === 'pot'
          ? 'Create Pot'
          : 'Create Recurring Bill'

  const renderBody = () => {
    if (activeModal === 'transaction') {
      return (
        <form onSubmit={onSubmitTransaction} className="space-y-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Type</p>
            <div className="grid grid-cols-2 gap-2">
              {(['expense', 'income'] as TransactionKind[]).map((kind) => {
                const active = transactionForm.kind === kind
                const activeClass = kind === 'expense' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'

                return (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.01 }}
                    key={kind}
                    type="button"
                    onClick={() => setTransactionForm((prev) => ({ ...prev, kind }))}
                    className={
                      active
                        ? `rounded-2xl px-3 py-2 text-sm font-semibold ${activeClass}`
                        : 'rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700'
                    }
                  >
                    {kind === 'expense' ? 'Expense' : 'Income'}
                  </motion.button>
                )
              })}
            </div>
          </div>

          <CategoryDropdown
            label="Category"
            placeholder="Choose category"
            value={transactionForm.category}
            options={categoryOptions}
            onChange={(value) => setTransactionForm((prev) => ({ ...prev, category: value }))}
          />

          <input
            required
            type="number"
            min={0.01}
            step="0.01"
            value={transactionForm.amount}
            onChange={(event) => setTransactionForm((prev) => ({ ...prev, amount: event.target.value }))}
            placeholder="Amount"
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />

          <input
            required
            type="date"
            value={transactionForm.date}
            onChange={(event) => setTransactionForm((prev) => ({ ...prev, date: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />

          <textarea
            value={transactionForm.note}
            onChange={(event) => setTransactionForm((prev) => ({ ...prev, note: event.target.value }))}
            placeholder="Note"
            className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="h-12 w-full rounded-2xl bg-emerald-500 text-sm font-semibold text-white"
          >
            Save Transaction
          </motion.button>
        </form>
      )
    }

    if (activeModal === 'budget') {
      return (
        <form onSubmit={onSubmitBudget} className="space-y-3">
          <CategoryDropdown
            label="Category"
            placeholder="Choose budget category"
            value={budgetForm.category}
            options={categoryOptions}
            onChange={(value) => setBudgetForm((prev) => ({ ...prev, category: value }))}
          />

          <input
            required
            type="number"
            min={0.01}
            step="0.01"
            value={budgetForm.limit}
            onChange={(event) => setBudgetForm((prev) => ({ ...prev, limit: event.target.value }))}
            placeholder="Budget limit"
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="h-12 w-full rounded-2xl bg-emerald-500 text-sm font-semibold text-white"
          >
            Save Budget
          </motion.button>
        </form>
      )
    }

    if (activeModal === 'pot') {
      return (
        <form onSubmit={onSubmitPot} className="space-y-3">
          <input
            required
            value={potForm.name}
            onChange={(event) => setPotForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Pot name"
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          <input
            required
            type="number"
            min={1}
            step="0.01"
            value={potForm.target}
            onChange={(event) => setPotForm((prev) => ({ ...prev, target: event.target.value }))}
            placeholder="Target amount"
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          <input
            required
            type="number"
            min={0}
            step="0.01"
            value={potForm.current}
            onChange={(event) => setPotForm((prev) => ({ ...prev, current: event.target.value }))}
            placeholder="Current amount"
            className="h-12 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="h-12 w-full rounded-2xl bg-emerald-500 text-sm font-semibold text-white"
          >
            Save Pot
          </motion.button>
        </form>
      )
    }

    return (
      <form onSubmit={onSubmitBill} className="space-y-3">
        <input
          required
          value={billForm.title}
          onChange={(event) => setBillForm((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="Bill title"
          className="h-12 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
        <input
          required
          type="number"
          min={0.01}
          step="0.01"
          value={billForm.amount}
          onChange={(event) => setBillForm((prev) => ({ ...prev, amount: event.target.value }))}
          placeholder="Amount"
          className="h-12 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />
        <input
          required
          type="number"
          min={1}
          max={31}
          value={billForm.dueDay}
          onChange={(event) => setBillForm((prev) => ({ ...prev, dueDay: event.target.value }))}
          placeholder="Due day"
          className="h-12 w-full rounded-2xl border border-slate-300 bg-white/85 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />

        <div className="grid grid-cols-3 gap-2">
          {(['weekly', 'monthly', 'yearly'] as BillFrequency[]).map((frequency) => (
            <motion.button
              whileTap={{ scale: 0.97 }}
              key={frequency}
              type="button"
              onClick={() => setBillForm((prev) => ({ ...prev, frequency }))}
              className={
                billForm.frequency === frequency
                  ? 'rounded-xl bg-emerald-500 px-2 py-2 text-xs font-semibold text-white'
                  : 'rounded-xl border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700'
              }
            >
              {frequency}
            </motion.button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="h-12 w-full rounded-2xl bg-emerald-500 text-sm font-semibold text-white"
        >
          Save Bill
        </motion.button>
      </form>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-3"
      onClick={onClose}
    >
      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-xl rounded-3xl border border-slate-300 bg-white p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">{modalTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600"
          >
            <X size={16} />
          </button>
        </div>
        {renderBody()}
      </motion.section>
    </motion.div>
  )
}
