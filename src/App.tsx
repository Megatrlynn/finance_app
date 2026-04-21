import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeftRight, Home, LineChart, LogOut, Moon, PiggyBank, Plus, ReceiptText, Sun, Target } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { DataControlPanel } from './components/DataControlPanel'
import { MainLayout, type NavTab } from './components/MainLayout'
import {
  addBudget,
  addPot,
  addRecurringBill,
  addTransaction,
  createAccount,
  deleteBudget,
  deletePot,
  deleteRecurringBill,
  getUserRecord,
  login,
  logout,
  onAuthChange,
  restoreBudget,
  restorePot,
  restoreRecurringBill,
  updateBudget,
  updateRecurringBill,
  updatePot,
} from './lib/database'
import { computeSummary } from './lib/finance'
import { buildInsightSeries } from './lib/insights'
import {
  applyDataExplorerFilters,
  defaultDataExplorerFilters,
  getFilterCategories,
  isDataFilterTab,
  type DataExplorerFilters,
} from './lib/dataExplorer'
import type {
  AppTab,
  BillFrequency,
  Budget,
  BudgetInput,
  FinanceData,
  Pot,
  PotInput,
  RecurringBill,
  RecurringBillInput,
  ToastMessage,
  TransactionInput,
  TransactionKind,
  UserRecord,
} from './types'
import type { AuthMode, AuthValues } from './components/AuthCard'

const LazyAuthCard = lazy(() => import('./components/AuthCard').then((module) => ({ default: module.AuthCard })))
const LazyInsightsPage = lazy(() =>
  import('./components/InsightsPage').then((module) => ({ default: module.InsightsPage })),
)
const LazyHomeTab = lazy(() => import('./components/tabs/HomeTab').then((module) => ({ default: module.HomeTab })))
const LazyTransactionsTab = lazy(() =>
  import('./components/tabs/TransactionsTab').then((module) => ({ default: module.TransactionsTab })),
)
const LazyBudgetsTab = lazy(() =>
  import('./components/tabs/BudgetsTab').then((module) => ({ default: module.BudgetsTab })),
)
const LazyPotsTab = lazy(() => import('./components/tabs/PotsTab').then((module) => ({ default: module.PotsTab })))
const LazyBillsTab = lazy(() => import('./components/tabs/BillsTab').then((module) => ({ default: module.BillsTab })))
const LazyFinanceFormModal = lazy(() =>
  import('./components/modals/FinanceFormModal').then((module) => ({ default: module.FinanceFormModal })),
)
const LazyBudgetEditorModal = lazy(() =>
  import('./components/modals/BudgetEditorModal').then((module) => ({ default: module.BudgetEditorModal })),
)
const LazyPotEditorModal = lazy(() =>
  import('./components/modals/PotEditorModal').then((module) => ({ default: module.PotEditorModal })),
)
const LazyBillEditorModal = lazy(() =>
  import('./components/modals/BillEditorModal').then((module) => ({ default: module.BillEditorModal })),
)
const LazyConfirmDialog = lazy(() =>
  import('./components/modals/ConfirmDialog').then((module) => ({ default: module.ConfirmDialog })),
)

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

interface BudgetEditFormState {
  category: string
  limit: string
}

interface PotEditFormState {
  name: string
  target: string
  current: string
}

interface BillEditFormState {
  title: string
  amount: string
  dueDay: string
  frequency: BillFrequency
}

type UndoDeleteState =
  | {
      type: 'budget'
      item: Budget
    }
  | {
      type: 'pot'
      item: Pot
    }
  | {
      type: 'bill'
      item: RecurringBill
    }
  | null

interface SparkPoint {
  label: string
  value: number
}

type FormModal = 'transaction' | 'budget' | 'pot' | 'bill' | null
type ThemeMode = 'light' | 'dark'

const tabOrder: AppTab[] = ['home', 'transactions', 'budgets', 'pots', 'recurring-bills', 'analytics']
const THEME_STORAGE_KEY = 'pf_theme_v1'

const tabs: NavTab[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'budgets', label: 'Budgets', icon: Target },
  { id: 'pots', label: 'Pots', icon: PiggyBank },
  { id: 'recurring-bills', label: 'Bills', icon: ReceiptText },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
]

const modalFromTab: Partial<Record<AppTab, FormModal>> = {
  transactions: 'transaction',
  budgets: 'budget',
  pots: 'pot',
  'recurring-bills': 'bill',
}

const today = (): string => new Date().toISOString().slice(0, 10)

const emptyData: FinanceData = {
  transactions: [],
  budgets: [],
  pots: [],
  recurringBills: [],
}

const tabTransition = {
  initial: (direction: number) => ({ opacity: 0, x: direction > 0 ? 32 : -32 }),
  animate: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -32 : 32 }),
}

const buildLast7DaysSeries = (
  data: FinanceData,
  mode: 'net' | 'income' | 'expense' | 'savings',
): SparkPoint[] => {
  const now = new Date()
  const base = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (6 - index))
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleString('en-US', { weekday: 'short' }),
      value: 0,
    }
  })

  if (mode === 'savings') {
    const total = data.pots.reduce((sum, pot) => sum + pot.current, 0)
    return base.map((day, index) => ({ ...day, value: total * (0.6 + index * 0.06) }))
  }

  for (const transaction of data.transactions) {
    const dayKey = transaction.date.slice(0, 10)
    const day = base.find((item) => item.key === dayKey)
    if (!day) {
      continue
    }

    if (mode === 'income' && transaction.kind === 'income') {
      day.value += transaction.amount
    }

    if (mode === 'expense' && transaction.kind === 'expense') {
      day.value += transaction.amount
    }

    if (mode === 'net') {
      day.value += transaction.kind === 'income' ? transaction.amount : -transaction.amount
    }
  }

  return base.map(({ label, value }) => ({ label, value }))
}

function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') {
      return saved
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const [loading, setLoading] = useState(true)
  const [authBusy, setAuthBusy] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('signup')
  const [authValues, setAuthValues] = useState<AuthValues>({ name: '', email: '', password: '' })

  const [activeTab, setActiveTab] = useState<AppTab>('home')
  const [tabDirection, setTabDirection] = useState(1)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null)
  const [activeModal, setActiveModal] = useState<FormModal>(null)
  const [dataFilters, setDataFilters] = useState<DataExplorerFilters>(defaultDataExplorerFilters)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [editingPot, setEditingPot] = useState<Pot | null>(null)
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null)
  const [budgetEditForm, setBudgetEditForm] = useState<BudgetEditFormState>({ category: '', limit: '' })
  const [potEditForm, setPotEditForm] = useState<PotEditFormState>({ name: '', target: '', current: '' })
  const [billEditForm, setBillEditForm] = useState<BillEditFormState>({
    title: '',
    amount: '',
    dueDay: '',
    frequency: 'monthly',
  })
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    onConfirm: () => Promise<void>
  }>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    onConfirm: async () => undefined,
  })

  const [transactionForm, setTransactionForm] = useState<TransactionFormState>({
    kind: 'expense',
    amount: '',
    category: '',
    note: '',
    date: today(),
  })
  const [budgetForm, setBudgetForm] = useState<BudgetFormState>({ category: '', limit: '' })
  const [potForm, setPotForm] = useState<PotFormState>({ name: '', target: '', current: '0' })
  const [billForm, setBillForm] = useState<BillFormState>({
    title: '',
    amount: '',
    dueDay: '',
    frequency: 'monthly',
  })
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [undoDelete, setUndoDelete] = useState<UndoDeleteState>(null)
  const undoTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUserId(firebaseUser.uid)
        const userRecord = await getUserRecord(firebaseUser.uid)
        setCurrentUser(userRecord)
      } else {
        setCurrentUserId(null)
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current !== null) {
        window.clearTimeout(undoTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', themeMode === 'dark')
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }, [themeMode])

  const pushToast = (variant: ToastMessage['variant'], message: string): void => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const toast: ToastMessage = { id, variant, message }

    setToasts((existing) => [toast, ...existing])
    window.setTimeout(() => {
      setToasts((existing) => existing.filter((item) => item.id !== id))
    }, 2600)
  }

  const refreshCurrentUser = async (userId: string): Promise<void> => {
    const updated = await getUserRecord(userId)
    setCurrentUser(updated)
  }

  const handleTabChange = (tabId: string): void => {
    const next = tabId as AppTab
    if (next === activeTab) {
      return
    }

    const currentIndex = tabOrder.indexOf(activeTab)
    const nextIndex = tabOrder.indexOf(next)
    setTabDirection(nextIndex > currentIndex ? 1 : -1)
    setActiveTab(next)
  }

  const data = currentUser?.data ?? emptyData
  const filterCategories = useMemo(() => getFilterCategories(data), [data])
  const filteredData = useMemo(() => applyDataExplorerFilters(data, dataFilters), [data, dataFilters])

  const summary = useMemo(() => computeSummary(data), [data])
  const insights = useMemo(() => buildInsightSeries(filteredData), [filteredData])

  const homeSparklines = useMemo(
    () => ({
      net: buildLast7DaysSeries(data, 'net'),
      income: buildLast7DaysSeries(data, 'income'),
      expense: buildLast7DaysSeries(data, 'expense'),
      savings: buildLast7DaysSeries(data, 'savings'),
    }),
    [data],
  )

  const recentFiveTransactions = useMemo(() => data.transactions.slice(0, 5), [data.transactions])

  const updateDataFilter = <K extends keyof DataExplorerFilters>(key: K, value: DataExplorerFilters[K]): void => {
    setDataFilters((existing) => ({ ...existing, [key]: value }))
  }

  const resetDataFilters = (): void => {
    setDataFilters(defaultDataExplorerFilters)
  }

  const homeCards = [
    {
      title: 'Net Balance',
      value: summary.netBalance,
      spark: homeSparklines.net,
      positive: summary.netBalance >= 0,
    },
    {
      title: 'Income',
      value: summary.totalIncome,
      spark: homeSparklines.income,
      positive: true,
    },
    {
      title: 'Expenses',
      value: summary.totalExpense,
      spark: homeSparklines.expense,
      positive: false,
    },
    {
      title: 'Savings',
      value: summary.totalSavedInPots,
      spark: homeSparklines.savings,
      positive: true,
    },
  ]

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setAuthBusy(true)

    const result =
      authMode === 'signup'
        ? await createAccount(authValues.name, authValues.email, authValues.password)
        : await login(authValues.email, authValues.password)

    if (!result.ok || !result.userId) {
      pushToast('error', result.message)
      setAuthBusy(false)
      return
    }

    setAuthValues({ name: '', email: '', password: '' })
    pushToast('success', result.message)
    setAuthBusy(false)
  }

  const handleLogout = async (): Promise<void> => {
    await logout()
    setCurrentUserId(null)
    setCurrentUser(null)
    setActiveTab('home')
    setDataFilters(defaultDataExplorerFilters)
    setUndoDelete(null)
    if (undoTimeoutRef.current !== null) {
      window.clearTimeout(undoTimeoutRef.current)
      undoTimeoutRef.current = null
    }
    pushToast('info', 'You have been logged out.')
  }

  const queueUndoDelete = (state: Exclude<UndoDeleteState, null>): void => {
    setUndoDelete(state)

    if (undoTimeoutRef.current !== null) {
      window.clearTimeout(undoTimeoutRef.current)
    }

    undoTimeoutRef.current = window.setTimeout(() => {
      setUndoDelete(null)
      undoTimeoutRef.current = null
    }, 5000)
  }

  const handleUndoDelete = async (): Promise<void> => {
    if (!currentUser || !undoDelete) {
      return
    }

    const result =
      undoDelete.type === 'budget'
        ? await restoreBudget(currentUserId!, undoDelete.item)
        : undoDelete.type === 'pot'
          ? await restorePot(currentUserId!, undoDelete.item)
          : await restoreRecurringBill(currentUserId!, undoDelete.item)

    if (!result) {
      pushToast('error', 'Unable to undo deletion.')
      return
    }

    if (undoTimeoutRef.current !== null) {
      window.clearTimeout(undoTimeoutRef.current)
      undoTimeoutRef.current = null
    }

    await refreshCurrentUser(currentUserId!)
    setUndoDelete(null)
    pushToast(
      'success',
      `${undoDelete.type === 'budget' ? 'Budget' : undoDelete.type === 'pot' ? 'Pot' : 'Recurring bill'} restored.`,
    )
  }

  const handleTransactionSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!currentUser || !transactionForm.category) {
      pushToast('error', 'Pick a transaction category first.')
      return
    }

    const input: TransactionInput = {
      kind: transactionForm.kind,
      amount: Number(transactionForm.amount),
      category: transactionForm.category,
      note: transactionForm.note.trim(),
      date: transactionForm.date,
    }

    const transaction = await addTransaction(currentUserId!, input)
    if (!transaction) {
      pushToast('error', 'Unable to save transaction.')
      return
    }

    await refreshCurrentUser(currentUserId!)
    setTransactionForm({ kind: 'expense', amount: '', category: '', note: '', date: today() })
    setActiveModal(null)
    pushToast('success', 'Transaction saved.')
  }

  const handleBudgetSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!currentUser || !budgetForm.category) {
      pushToast('error', 'Pick a budget category first.')
      return
    }

    const input: BudgetInput = {
      category: budgetForm.category,
      limit: Number(budgetForm.limit),
    }

    const budget = await addBudget(currentUserId!, input)
    if (!budget) {
      pushToast('error', 'Unable to save budget.')
      return
    }

    await refreshCurrentUser(currentUserId!)
    setBudgetForm({ category: '', limit: '' })
    setActiveModal(null)
    pushToast('success', 'Budget saved.')
  }

  const handlePotSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!currentUser) {
      return
    }

    const input: PotInput = {
      name: potForm.name.trim(),
      target: Number(potForm.target),
      current: Number(potForm.current),
    }

    const pot = await addPot(currentUserId!, input)
    if (!pot) {
      pushToast('error', 'Unable to save pot.')
      return
    }

    await refreshCurrentUser(currentUserId!)
    setPotForm({ name: '', target: '', current: '0' })
    setActiveModal(null)
    pushToast('success', 'Savings pot created.')
  }

  const handleBillSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!currentUser) {
      return
    }

    const input: RecurringBillInput = {
      title: billForm.title.trim(),
      amount: Number(billForm.amount),
      dueDay: Number(billForm.dueDay),
      frequency: billForm.frequency,
    }

    const recurringBill = await addRecurringBill(currentUserId!, input)
    if (!recurringBill) {
      pushToast('error', 'Unable to save recurring bill.')
      return
    }

    await refreshCurrentUser(currentUserId!)
    setBillForm({ title: '', amount: '', dueDay: '', frequency: 'monthly' })
    setActiveModal(null)
    pushToast('success', 'Recurring bill saved.')
  }

  const handleEditBudgetOpen = (budget: Budget): void => {
    setEditingBudget(budget)
    setBudgetEditForm({ category: budget.category, limit: String(budget.limit) })
  }

  const handleEditPotOpen = (pot: Pot): void => {
    setEditingPot(pot)
    setPotEditForm({ name: pot.name, target: String(pot.target), current: String(pot.current) })
  }

  const handleEditBillOpen = (bill: RecurringBill): void => {
    setEditingBill(bill)
    setBillEditForm({
      title: bill.title,
      amount: String(bill.amount),
      dueDay: String(bill.dueDay),
      frequency: bill.frequency,
    })
  }

  const handleBudgetEditSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!currentUser || !editingBudget || !budgetEditForm.category.trim()) {
      return
    }

    const updated = await updateBudget(currentUserId!, editingBudget.id, {
      category: budgetEditForm.category.trim(),
      limit: Number(budgetEditForm.limit),
    })

    if (!updated) {
      pushToast('error', 'Unable to update budget.')
      return
    }

    await refreshCurrentUser(currentUserId!)
    setEditingBudget(null)
    pushToast('success', 'Budget updated.')
  }

  const handlePotEditSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!currentUser || !editingPot || !potEditForm.name.trim()) {
      return
    }

    const updated = await updatePot(currentUserId!, editingPot.id, {
      name: potEditForm.name.trim(),
      target: Number(potEditForm.target),
      current: Number(potEditForm.current),
    })

    if (!updated) {
      pushToast('error', 'Unable to update pot.')
      return
    }

    await refreshCurrentUser(currentUserId!)
    setEditingPot(null)
    pushToast('success', 'Pot updated.')
  }

  const handleBillEditSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!currentUser || !editingBill || !billEditForm.title.trim()) {
      return
    }

    const updated = await updateRecurringBill(currentUserId!, editingBill.id, {
      title: billEditForm.title.trim(),
      amount: Number(billEditForm.amount),
      dueDay: Number(billEditForm.dueDay),
      frequency: billEditForm.frequency,
    })

    if (!updated) {
      pushToast('error', 'Unable to update recurring bill.')
      return
    }

    await refreshCurrentUser(currentUserId!)
    setEditingBill(null)
    pushToast('success', 'Recurring bill updated.')
  }

  const openBudgetDeleteConfirm = (budget: Budget): void => {
    if (!currentUser) {
      return
    }

    setConfirmDialog({
      open: true,
      title: `Delete budget: ${budget.category}?`,
      description: 'This action is permanent and cannot be undone.',
      confirmLabel: 'Delete Budget',
      onConfirm: async () => {
        const ok = await deleteBudget(currentUserId!, budget.id)
        if (!ok) {
          pushToast('error', 'Unable to delete budget.')
          return
        }

        await refreshCurrentUser(currentUserId!)
        queueUndoDelete({ type: 'budget', item: budget })
        pushToast('info', 'Budget deleted. You can undo for 5 seconds.')
      },
    })
  }

  const openPotDeleteConfirm = (pot: Pot): void => {
    if (!currentUser) {
      return
    }

    setConfirmDialog({
      open: true,
      title: `Delete pot: ${pot.name}?`,
      description: 'This action is permanent and cannot be undone.',
      confirmLabel: 'Delete Pot',
      onConfirm: async () => {
        const ok = await deletePot(currentUserId!, pot.id)
        if (!ok) {
          pushToast('error', 'Unable to delete pot.')
          return
        }

        await refreshCurrentUser(currentUserId!)
        queueUndoDelete({ type: 'pot', item: pot })
        pushToast('info', 'Pot deleted. You can undo for 5 seconds.')
      },
    })
  }

  const openBillDeleteConfirm = (bill: RecurringBill): void => {
    if (!currentUser) {
      return
    }

    setConfirmDialog({
      open: true,
      title: `Delete recurring bill: ${bill.title}?`,
      description: 'This action is permanent and cannot be undone.',
      confirmLabel: 'Delete Bill',
      onConfirm: async () => {
        const ok = await deleteRecurringBill(currentUserId!, bill.id)
        if (!ok) {
          pushToast('error', 'Unable to delete recurring bill.')
          return
        }

        await refreshCurrentUser(currentUserId!)
        queueUndoDelete({ type: 'bill', item: bill })
        pushToast('info', 'Recurring bill deleted. You can undo for 5 seconds.')
      },
    })
  }

  const closeConfirmDialog = (): void => {
    setConfirmDialog((existing) => ({ ...existing, open: false }))
  }

  const handleConfirmDialog = async (): Promise<void> => {
    await confirmDialog.onConfirm()
    closeConfirmDialog()
  }

  const renderTab = (): React.ReactNode => {
    if (activeTab === 'home') {
      return <LazyHomeTab cards={homeCards} recentTransactions={recentFiveTransactions} />
    }

    if (activeTab === 'analytics') {
      return (
        <LazyInsightsPage
          monthlySeries={insights.monthlySeries}
          spendingByCategory={insights.spendingByCategory}
          totalSpending={insights.totalSpending}
          incomeExpenseSplit={insights.incomeExpenseSplit}
        />
      )
    }

    if (activeTab === 'transactions') {
      return <LazyTransactionsTab transactions={filteredData.transactions} onAdd={() => setActiveModal('transaction')} />
    }

    if (activeTab === 'budgets') {
      return (
        <LazyBudgetsTab
          budgets={filteredData.budgets}
          onAdd={() => setActiveModal('budget')}
          onEdit={handleEditBudgetOpen}
          onDelete={openBudgetDeleteConfirm}
        />
      )
    }

    if (activeTab === 'pots') {
      return (
        <LazyPotsTab
          pots={filteredData.pots}
          onAdd={() => setActiveModal('pot')}
          onEdit={handleEditPotOpen}
          onDelete={openPotDeleteConfirm}
        />
      )
    }

    return (
      <LazyBillsTab
        bills={filteredData.recurringBills}
        onAdd={() => setActiveModal('bill')}
        onEdit={handleEditBillOpen}
        onDelete={openBillDeleteConfirm}
      />
    )
  }

  const floatingModalTarget = modalFromTab[activeTab] ?? null

  return (
    <div className="font-sans text-slate-800">
      <AnimatePresence>
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-screen items-center justify-center px-3"
          >
            <div className="w-full max-w-md rounded-3xl border border-slate-300 bg-white/85 p-6 text-center shadow-xl backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Loading</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Preparing your workspace</h2>
            </div>
          </motion.div>
        ) : null}

        {!loading && !currentUser ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-screen items-center justify-center px-3 py-6"
          >
            <Suspense
              fallback={
                <div className="w-full max-w-md rounded-3xl border border-slate-300 bg-white/85 p-6 text-center shadow-xl backdrop-blur-xl">
                  <p className="text-sm text-slate-600">Loading authentication...</p>
                </div>
              }
            >
              <LazyAuthCard
                mode={authMode}
                values={authValues}
                isBusy={authBusy}
                onModeChange={setAuthMode}
                onFieldChange={(field, value) => setAuthValues((prev) => ({ ...prev, [field]: value }))}
                onSubmit={handleAuthSubmit}
              />
            </Suspense>
          </motion.div>
        ) : null}

        {!loading && currentUser ? (
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MainLayout
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              title="Personal Finance"
              subtitle="Check your data everyday to see how well you perform."
              rightSlot={
                <div className="flex items-center gap-2">
                  <span className="hidden rounded-full border border-slate-300 bg-white/90 px-3 py-1 text-xs text-slate-700 sm:inline-flex">
                    {currentUser.email}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    aria-label={themeMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                    onClick={() => setThemeMode((current) => (current === 'dark' ? 'light' : 'dark'))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white/90 text-slate-700 shadow-sm backdrop-blur sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-2 sm:text-sm sm:font-semibold"
                  >
                    {themeMode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                    <span className="hidden sm:inline">{themeMode === 'dark' ? 'Light' : 'Dark'}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:border-emerald-300 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
                  >
                    <LogOut size={16} />
                    Logout
                  </motion.button>
                </div>
              }
            >
              {isDataFilterTab(activeTab) ? (
                <DataControlPanel
                  activeTab={activeTab}
                  filters={dataFilters}
                  categories={filterCategories}
                  totals={data}
                  filtered={filteredData}
                  onChange={updateDataFilter}
                  onReset={resetDataFilters}
                />
              ) : null}

              <AnimatePresence mode="wait" custom={tabDirection}>
                <motion.div
                  key={activeTab}
                  custom={tabDirection}
                  variants={tabTransition}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.28, ease: 'easeInOut' }}
                >
                  <Suspense
                    fallback={
                      <div className="rounded-3xl border border-slate-300 bg-white/85 p-8 text-center text-sm text-slate-600 shadow-lg backdrop-blur-xl">
                        Loading section...
                      </div>
                    }
                  >
                    {renderTab()}
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            </MainLayout>

            {floatingModalTarget ? (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveModal(floatingModalTarget)}
                className="fixed bottom-24 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xl md:hidden"
              >
                <Plus size={22} />
              </motion.button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeModal ? (
          <Suspense
            fallback={
              <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-3">
                <div className="w-full max-w-xl rounded-3xl border border-slate-300 bg-white p-4 shadow-2xl">
                  <p className="text-sm text-slate-600">Loading form...</p>
                </div>
              </div>
            }
          >
            <LazyFinanceFormModal
              activeModal={activeModal}
              onClose={() => setActiveModal(null)}
              transactionForm={transactionForm}
              setTransactionForm={setTransactionForm}
              budgetForm={budgetForm}
              setBudgetForm={setBudgetForm}
              potForm={potForm}
              setPotForm={setPotForm}
              billForm={billForm}
              setBillForm={setBillForm}
              onSubmitTransaction={handleTransactionSubmit}
              onSubmitBudget={handleBudgetSubmit}
              onSubmitPot={handlePotSubmit}
              onSubmitBill={handleBillSubmit}
            />
          </Suspense>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {editingBudget ? (
          <Suspense fallback={null}>
            <LazyBudgetEditorModal
              open={Boolean(editingBudget)}
              category={budgetEditForm.category}
              limit={budgetEditForm.limit}
              onChangeCategory={(value) => setBudgetEditForm((existing) => ({ ...existing, category: value }))}
              onChangeLimit={(value) => setBudgetEditForm((existing) => ({ ...existing, limit: value }))}
              onClose={() => setEditingBudget(null)}
              onSubmit={handleBudgetEditSubmit}
            />
          </Suspense>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {editingPot ? (
          <Suspense fallback={null}>
            <LazyPotEditorModal
              open={Boolean(editingPot)}
              name={potEditForm.name}
              target={potEditForm.target}
              current={potEditForm.current}
              onChangeName={(value) => setPotEditForm((existing) => ({ ...existing, name: value }))}
              onChangeTarget={(value) => setPotEditForm((existing) => ({ ...existing, target: value }))}
              onChangeCurrent={(value) => setPotEditForm((existing) => ({ ...existing, current: value }))}
              onClose={() => setEditingPot(null)}
              onSubmit={handlePotEditSubmit}
            />
          </Suspense>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {editingBill ? (
          <Suspense fallback={null}>
            <LazyBillEditorModal
              open={Boolean(editingBill)}
              title={billEditForm.title}
              amount={billEditForm.amount}
              dueDay={billEditForm.dueDay}
              frequency={billEditForm.frequency}
              onChangeTitle={(value) => setBillEditForm((existing) => ({ ...existing, title: value }))}
              onChangeAmount={(value) => setBillEditForm((existing) => ({ ...existing, amount: value }))}
              onChangeDueDay={(value) => setBillEditForm((existing) => ({ ...existing, dueDay: value }))}
              onChangeFrequency={(value) => setBillEditForm((existing) => ({ ...existing, frequency: value }))}
              onClose={() => setEditingBill(null)}
              onSubmit={handleBillEditSubmit}
            />
          </Suspense>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog.open ? (
          <Suspense fallback={null}>
            <LazyConfirmDialog
              open={confirmDialog.open}
              title={confirmDialog.title}
              description={confirmDialog.description}
              confirmLabel={confirmDialog.confirmLabel}
              onCancel={closeConfirmDialog}
              onConfirm={() => {
                void handleConfirmDialog()
              }}
            />
          </Suspense>
        ) : null}
      </AnimatePresence>

      <div className="fixed right-3 top-3 z-40 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className={
                toast.variant === 'success'
                  ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 shadow-lg'
                  : toast.variant === 'error'
                    ? 'rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800 shadow-lg'
                    : 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-lg'
              }
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {undoDelete ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-24 left-1/2 z-40 w-[min(92vw,520px)] -translate-x-1/2 rounded-2xl border border-slate-300 bg-white/95 p-3 shadow-2xl backdrop-blur"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-700">
                {undoDelete.type === 'budget'
                  ? `Deleted budget '${undoDelete.item.category}'.`
                  : undoDelete.type === 'pot'
                    ? `Deleted pot '${undoDelete.item.name}'.`
                    : `Deleted recurring bill '${undoDelete.item.title}'.`}
              </p>
              <button
                type="button"
                onClick={() => {
                  void handleUndoDelete()
                }}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:border-emerald-300 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
              >
                Undo
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default App


