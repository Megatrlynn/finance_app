import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AppTab, FinanceData } from '../types'
import type { DataExplorerFilters } from '../lib/dataExplorer'

interface DataControlPanelProps {
  activeTab: AppTab
  filters: DataExplorerFilters
  categories: string[]
  totals: FinanceData
  filtered: FinanceData
  onChange: <K extends keyof DataExplorerFilters>(key: K, value: DataExplorerFilters[K]) => void
  onReset: () => void
}

function activeTabStats(activeTab: AppTab, totals: FinanceData, filtered: FinanceData): { label: string; total: number; filtered: number } {
  if (activeTab === 'transactions') {
    return { label: 'Transactions', total: totals.transactions.length, filtered: filtered.transactions.length }
  }

  if (activeTab === 'budgets') {
    return { label: 'Budgets', total: totals.budgets.length, filtered: filtered.budgets.length }
  }

  if (activeTab === 'pots') {
    return { label: 'Pots', total: totals.pots.length, filtered: filtered.pots.length }
  }

  if (activeTab === 'recurring-bills') {
    return { label: 'Bills', total: totals.recurringBills.length, filtered: filtered.recurringBills.length }
  }

  return {
    label: 'All data records',
    total: totals.transactions.length + totals.budgets.length + totals.pots.length + totals.recurringBills.length,
    filtered: filtered.transactions.length + filtered.budgets.length + filtered.pots.length + filtered.recurringBills.length,
  }
}

export function DataControlPanel({
  activeTab,
  filters,
  categories,
  totals,
  filtered,
  onChange,
  onReset,
}: DataControlPanelProps) {
  const [expanded, setExpanded] = useState(false)

  const activeFilterCount = useMemo(() => {
    let count = 0

    if (filters.query.trim()) count += 1
    if (filters.category !== 'all') count += 1
    if (filters.minAmount.trim()) count += 1
    if (filters.maxAmount.trim()) count += 1
    if (filters.fromDate) count += 1
    if (filters.toDate) count += 1
    if (filters.transactionKind !== 'all') count += 1
    if (filters.billFrequency !== 'all') count += 1
    if (filters.dueDayMin.trim()) count += 1
    if (filters.dueDayMax.trim()) count += 1
    if (filters.budgetStatus !== 'all') count += 1
    if (filters.potStatus !== 'all') count += 1

    return count
  }, [filters])

  const stats = useMemo(() => activeTabStats(activeTab, totals, filtered), [activeTab, totals, filtered])

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 rounded-3xl border border-slate-300 bg-white/90 p-3 shadow-lg backdrop-blur-xl"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search & Filters</p>
        <p className="text-xs font-medium text-slate-600">
          Showing <span className="font-bold text-slate-900">{stats.filtered}</span> of <span className="font-bold text-slate-900">{stats.total}</span> {stats.label.toLowerCase()}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-55 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={filters.query}
            onChange={(event) => onChange('query', event.target.value)}
            placeholder="Search current data by name, note, category, value, date..."
            className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-10 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
        >
          <SlidersHorizontal size={16} />
          Advanced
        </button>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
        >
          <X size={16} />
          Clear
        </button>

        {activeFilterCount > 0 ? (
          <span className="inline-flex h-7 items-center rounded-full bg-emerald-100 px-3 text-xs font-semibold text-emerald-800">
            {activeFilterCount} active filters
          </span>
        ) : null}
      </div>

      {expanded ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4"
        >
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Category</span>
            <select
              value={filters.category}
              onChange={(event) => onChange('category', event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Min amount</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={filters.minAmount}
              onChange={(event) => onChange('minAmount', event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Max amount</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={filters.maxAmount}
              onChange={(event) => onChange('maxAmount', event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
            />
          </label>

          {(activeTab === 'transactions' || activeTab === 'analytics') ? (
            <>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Type</span>
                <select
                  value={filters.transactionKind}
                  onChange={(event) => onChange('transactionKind', event.target.value as DataExplorerFilters['transactionKind'])}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="all">All</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">From date</span>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(event) => onChange('fromDate', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">To date</span>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(event) => onChange('toDate', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sort</span>
                <select
                  value={filters.transactionSort}
                  onChange={(event) => onChange('transactionSort', event.target.value as DataExplorerFilters['transactionSort'])}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="date-desc">Newest first</option>
                  <option value="date-asc">Oldest first</option>
                  <option value="amount-desc">Amount high to low</option>
                  <option value="amount-asc">Amount low to high</option>
                </select>
              </label>
            </>
          ) : null}

          {activeTab === 'budgets' ? (
            <>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Status</span>
                <select
                  value={filters.budgetStatus}
                  onChange={(event) => onChange('budgetStatus', event.target.value as DataExplorerFilters['budgetStatus'])}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="all">All</option>
                  <option value="within">Within budget</option>
                  <option value="over">Over budget</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sort</span>
                <select
                  value={filters.budgetSort}
                  onChange={(event) => onChange('budgetSort', event.target.value as DataExplorerFilters['budgetSort'])}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="remaining-asc">Least remaining</option>
                  <option value="remaining-desc">Most remaining</option>
                  <option value="limit-desc">Highest limit</option>
                  <option value="limit-asc">Lowest limit</option>
                </select>
              </label>
            </>
          ) : null}

          {activeTab === 'pots' ? (
            <>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pot status</span>
                <select
                  value={filters.potStatus}
                  onChange={(event) => onChange('potStatus', event.target.value as DataExplorerFilters['potStatus'])}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="all">All</option>
                  <option value="in-progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sort</span>
                <select
                  value={filters.potSort}
                  onChange={(event) => onChange('potSort', event.target.value as DataExplorerFilters['potSort'])}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="progress-desc">Most complete</option>
                  <option value="progress-asc">Least complete</option>
                  <option value="target-desc">Highest target</option>
                  <option value="target-asc">Lowest target</option>
                </select>
              </label>
            </>
          ) : null}

          {(activeTab === 'recurring-bills' || activeTab === 'analytics') ? (
            <>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Frequency</span>
                <select
                  value={filters.billFrequency}
                  onChange={(event) => onChange('billFrequency', event.target.value as DataExplorerFilters['billFrequency'])}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="all">All</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Due day from</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={filters.dueDayMin}
                  onChange={(event) => onChange('dueDayMin', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Due day to</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={filters.dueDayMax}
                  onChange={(event) => onChange('dueDayMax', event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sort</span>
                <select
                  value={filters.billSort}
                  onChange={(event) => onChange('billSort', event.target.value as DataExplorerFilters['billSort'])}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="due-asc">Earliest due day</option>
                  <option value="due-desc">Latest due day</option>
                  <option value="amount-desc">Amount high to low</option>
                  <option value="amount-asc">Amount low to high</option>
                </select>
              </label>
            </>
          ) : null}
        </motion.div>
      ) : null}
    </motion.section>
  )
}
