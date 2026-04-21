import type { FinanceData } from '../types'

export interface MonthSeriesItem {
  month: string
  income: number
  expense: number
  balance: number
}

export interface CategorySeriesItem {
  name: string
  value: number
}

export interface IncomeExpenseSlice {
  name: 'Income' | 'Expense'
  value: number
}

export interface InsightSeries {
  monthlySeries: MonthSeriesItem[]
  spendingByCategory: CategorySeriesItem[]
  totalSpending: number
  incomeExpenseSplit: IncomeExpenseSlice[]
}

export const buildInsightSeries = (data: FinanceData): InsightSeries => {
  const now = new Date()
  const monthSeed: MonthSeriesItem[] = []

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    monthSeed.push({
      month: date.toLocaleString('en-US', { month: 'short' }),
      income: 0,
      expense: 0,
      balance: 0,
    })
  }

  let totalIncome = 0
  let totalExpense = 0

  for (const tx of data.transactions) {
    const date = new Date(tx.date)
    const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())
    if (diffMonths >= 0 && diffMonths <= 5) {
      const index = 5 - diffMonths
      const bucket = monthSeed[index]
      if (bucket) {
        if (tx.kind === 'income') {
          bucket.income += tx.amount
        } else {
          bucket.expense += tx.amount
        }
        bucket.balance = bucket.income - bucket.expense
      }
    }

    if (tx.kind === 'income') {
      totalIncome += tx.amount
    } else {
      totalExpense += tx.amount
    }
  }

  const byCategory = new Map<string, number>()
  for (const tx of data.transactions) {
    if (tx.kind !== 'expense') {
      continue
    }
    byCategory.set(tx.category, (byCategory.get(tx.category) ?? 0) + tx.amount)
  }

  const spendingByCategory = [...byCategory.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const totalSpending = spendingByCategory.reduce((sum, item) => sum + item.value, 0)

  return {
    monthlySeries: monthSeed,
    spendingByCategory,
    totalSpending,
    incomeExpenseSplit: [
      { name: 'Income', value: totalIncome },
      { name: 'Expense', value: totalExpense },
    ],
  }
}
