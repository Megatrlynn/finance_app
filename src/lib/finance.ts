import type { FinanceData, FinanceSummary, RecurringBill } from '../types';

const toMonthlyAmount = (bill: RecurringBill): number => {
  if (bill.frequency === 'weekly') {
    return bill.amount * 4.33;
  }
  if (bill.frequency === 'yearly') {
    return bill.amount / 12;
  }
  return bill.amount;
};

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export const computeSummary = (data: FinanceData): FinanceSummary => {
  const totalIncome = data.transactions
    .filter((t) => t.kind === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = data.transactions
    .filter((t) => t.kind === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavedInPots = data.pots.reduce((sum, pot) => sum + pot.current, 0);
  const budgetLimit = data.budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const budgetSpent = data.budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const monthlyBillsEstimate = data.recurringBills.reduce(
    (sum, bill) => sum + toMonthlyAmount(bill),
    0,
  );

  return {
    totalIncome,
    totalExpense,
    totalSavedInPots,
    netBalance: totalIncome - totalExpense,
    remainingBudget: budgetLimit - budgetSpent,
    monthlyBillsEstimate,
  };
};
