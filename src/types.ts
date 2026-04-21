export type UserId = string;
export type ISODate = string;

export type TransactionKind = 'income' | 'expense';
export type BillFrequency = 'weekly' | 'monthly' | 'yearly';
export type AppTab = 'home' | 'transactions' | 'budgets' | 'pots' | 'recurring-bills' | 'analytics';

export interface AuthUser {
  id: UserId;
  name: string;
  email: string;
  password: string;
  createdAt: ISODate;
}

export interface Transaction {
  id: string;
  kind: TransactionKind;
  amount: number;
  category: string;
  note: string;
  date: ISODate;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  createdAt: ISODate;
}

export interface Pot {
  id: string;
  name: string;
  target: number;
  current: number;
  createdAt: ISODate;
}

export interface RecurringBill {
  id: string;
  title: string;
  amount: number;
  dueDay: number;
  frequency: BillFrequency;
  createdAt: ISODate;
}

export interface FinanceData {
  transactions: Transaction[];
  budgets: Budget[];
  pots: Pot[];
  recurringBills: RecurringBill[];
}

export interface UserRecord {
  data: FinanceData;
  email: string;
}

export interface FinanceDatabase {
  users: Record<UserId, UserRecord>;
  emailToUserId: Record<string, UserId>;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  totalSavedInPots: number;
  netBalance: number;
  remainingBudget: number;
  monthlyBillsEstimate: number;
}

export interface ToastMessage {
  id: string;
  variant: 'success' | 'error' | 'info';
  message: string;
}

export interface TransactionInput {
  kind: TransactionKind;
  amount: number;
  category: string;
  note: string;
  date: ISODate;
}

export interface BudgetInput {
  category: string;
  limit: number;
}

export interface PotInput {
  name: string;
  target: number;
  current: number;
}

export interface RecurringBillInput {
  title: string;
  amount: number;
  dueDay: number;
  frequency: BillFrequency;
}
