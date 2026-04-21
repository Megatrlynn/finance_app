import type { AppTab, BillFrequency, FinanceData, TransactionKind } from '../types'

export type BudgetStatusFilter = 'all' | 'within' | 'over'
export type PotStatusFilter = 'all' | 'in-progress' | 'completed'

export type TransactionSort = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'
export type BudgetSort = 'remaining-asc' | 'remaining-desc' | 'limit-desc' | 'limit-asc'
export type PotSort = 'progress-desc' | 'progress-asc' | 'target-desc' | 'target-asc'
export type BillSort = 'due-asc' | 'due-desc' | 'amount-desc' | 'amount-asc'

export interface DataExplorerFilters {
  query: string
  category: string
  minAmount: string
  maxAmount: string
  fromDate: string
  toDate: string
  transactionKind: 'all' | TransactionKind
  billFrequency: 'all' | BillFrequency
  dueDayMin: string
  dueDayMax: string
  budgetStatus: BudgetStatusFilter
  potStatus: PotStatusFilter
  transactionSort: TransactionSort
  budgetSort: BudgetSort
  potSort: PotSort
  billSort: BillSort
}

export const defaultDataExplorerFilters: DataExplorerFilters = {
  query: '',
  category: 'all',
  minAmount: '',
  maxAmount: '',
  fromDate: '',
  toDate: '',
  transactionKind: 'all',
  billFrequency: 'all',
  dueDayMin: '',
  dueDayMax: '',
  budgetStatus: 'all',
  potStatus: 'all',
  transactionSort: 'date-desc',
  budgetSort: 'remaining-asc',
  potSort: 'progress-desc',
  billSort: 'due-asc',
}

const toNumber = (value: string): number | null => {
  if (!value.trim()) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const includesQuery = (query: string, values: Array<string | number>): boolean => {
  if (!query.trim()) {
    return true
  }

  const normalized = query.trim().toLowerCase()
  return values.some((value) => String(value).toLowerCase().includes(normalized))
}

const inDateRange = (date: string, fromDate: string, toDate: string): boolean => {
  if (fromDate && date < fromDate) {
    return false
  }

  if (toDate && date > toDate) {
    return false
  }

  return true
}

const inNumberRange = (value: number, minRaw: string, maxRaw: string): boolean => {
  const min = toNumber(minRaw)
  const max = toNumber(maxRaw)

  if (min !== null && value < min) {
    return false
  }

  if (max !== null && value > max) {
    return false
  }

  return true
}

export const isDataFilterTab = (tab: AppTab): boolean =>
  tab === 'transactions' || tab === 'budgets' || tab === 'pots' || tab === 'recurring-bills' || tab === 'analytics'

export const getFilterCategories = (data: FinanceData): string[] => {
  const values = new Set<string>()

  data.transactions.forEach((item) => values.add(item.category))
  data.budgets.forEach((item) => values.add(item.category))

  return Array.from(values).sort((a, b) => a.localeCompare(b))
}

export const applyDataExplorerFilters = (data: FinanceData, filters: DataExplorerFilters): FinanceData => {
  const transactions = data.transactions
    .filter((item) => {
      if (!includesQuery(filters.query, [item.category, item.note, item.amount, item.date])) {
        return false
      }

      if (filters.transactionKind !== 'all' && item.kind !== filters.transactionKind) {
        return false
      }

      if (filters.category !== 'all' && item.category !== filters.category) {
        return false
      }

      if (!inDateRange(item.date, filters.fromDate, filters.toDate)) {
        return false
      }

      return inNumberRange(item.amount, filters.minAmount, filters.maxAmount)
    })
    .sort((a, b) => {
      if (filters.transactionSort === 'date-asc') {
        return a.date.localeCompare(b.date)
      }

      if (filters.transactionSort === 'amount-desc') {
        return b.amount - a.amount
      }

      if (filters.transactionSort === 'amount-asc') {
        return a.amount - b.amount
      }

      return b.date.localeCompare(a.date)
    })

  const budgets = data.budgets
    .filter((item) => {
      const remaining = item.limit - item.spent
      if (!includesQuery(filters.query, [item.category, item.limit, item.spent, remaining])) {
        return false
      }

      if (filters.category !== 'all' && item.category !== filters.category) {
        return false
      }

      if (!inNumberRange(item.limit, filters.minAmount, filters.maxAmount)) {
        return false
      }

      if (filters.budgetStatus === 'within') {
        return remaining >= 0
      }

      if (filters.budgetStatus === 'over') {
        return remaining < 0
      }

      return true
    })
    .sort((a, b) => {
      const remainingA = a.limit - a.spent
      const remainingB = b.limit - b.spent

      if (filters.budgetSort === 'remaining-desc') {
        return remainingB - remainingA
      }

      if (filters.budgetSort === 'limit-desc') {
        return b.limit - a.limit
      }

      if (filters.budgetSort === 'limit-asc') {
        return a.limit - b.limit
      }

      return remainingA - remainingB
    })

  const pots = data.pots
    .filter((item) => {
      const progress = item.target === 0 ? 0 : item.current / item.target
      if (!includesQuery(filters.query, [item.name, item.current, item.target])) {
        return false
      }

      if (!inNumberRange(item.target, filters.minAmount, filters.maxAmount)) {
        return false
      }

      if (filters.potStatus === 'completed') {
        return progress >= 1
      }

      if (filters.potStatus === 'in-progress') {
        return progress < 1
      }

      return true
    })
    .sort((a, b) => {
      const progressA = a.target === 0 ? 0 : a.current / a.target
      const progressB = b.target === 0 ? 0 : b.current / b.target

      if (filters.potSort === 'progress-asc') {
        return progressA - progressB
      }

      if (filters.potSort === 'target-desc') {
        return b.target - a.target
      }

      if (filters.potSort === 'target-asc') {
        return a.target - b.target
      }

      return progressB - progressA
    })

  const recurringBills = data.recurringBills
    .filter((item) => {
      if (!includesQuery(filters.query, [item.title, item.amount, item.dueDay, item.frequency])) {
        return false
      }

      if (filters.billFrequency !== 'all' && item.frequency !== filters.billFrequency) {
        return false
      }

      if (!inNumberRange(item.amount, filters.minAmount, filters.maxAmount)) {
        return false
      }

      const minDue = toNumber(filters.dueDayMin)
      const maxDue = toNumber(filters.dueDayMax)

      if (minDue !== null && item.dueDay < minDue) {
        return false
      }

      if (maxDue !== null && item.dueDay > maxDue) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      if (filters.billSort === 'due-desc') {
        return b.dueDay - a.dueDay
      }

      if (filters.billSort === 'amount-desc') {
        return b.amount - a.amount
      }

      if (filters.billSort === 'amount-asc') {
        return a.amount - b.amount
      }

      return a.dueDay - b.dueDay
    })

  return {
    transactions,
    budgets,
    pots,
    recurringBills,
  }
}
