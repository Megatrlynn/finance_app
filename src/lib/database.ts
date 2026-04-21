import { initializeApp } from 'firebase/app'
import {
  doc,
  getDoc,
  getDocs,
  collection,
  runTransaction,
  getFirestore,
  type Firestore,
} from 'firebase/firestore'
import type {
  AuthUser,
  Budget,
  BudgetInput,
  FinanceData,
  Pot,
  PotInput,
  RecurringBill,
  RecurringBillInput,
  Transaction,
  TransactionInput,
  UserId,
} from '../types'

const SESSION_KEY = 'pf_session_v1'

const emptyData = (): FinanceData => ({
  transactions: [],
  budgets: [],
  pots: [],
  recurringBills: [],
})

const createId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const parseJson = <T>(raw: string | null, fallback: T): T => {
  if (!raw) {
    return fallback
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object') {
      return parsed as T
    }
    return fallback
  } catch {
    return fallback
  }
}

const hashPassword = async (password: string): Promise<string> => {
  if (!password) {
    return ''
  }

  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return password
  }

  const encoded = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId,
)

let firestoreDb: Firestore | null = null

const getDb = (): Firestore | null => {
  if (!isFirebaseConfigured) {
    return null
  }

  if (!firestoreDb) {
    const app = initializeApp(firebaseConfig)
    firestoreDb = getFirestore(app)
  }

  return firestoreDb
}

const usersCollectionName = 'users'
const emailLookupCollectionName = 'emailToUserId'

const firebaseNotConfiguredMessage =
  'Firebase is not configured. Add VITE_FIREBASE_* variables before using cloud storage.'

interface UserSummaryRecord {
  auth: AuthUser
  data: FinanceData
}

export interface AuthResult {
  ok: boolean
  message: string
  userId?: UserId
}

export const getSessionUserId = (): UserId | null => {
  const session = parseJson<{ userId?: string } | null>(localStorage.getItem(SESSION_KEY), null)
  if (!session?.userId || typeof session.userId !== 'string') {
    return null
  }
  return session.userId
}

export const setSessionUserId = (userId: UserId): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }))
}

export const clearSessionUserId = (): void => {
  localStorage.removeItem(SESSION_KEY)
}

export const loadSessionUser = async (): Promise<UserSummaryRecord | null> => {
  const db = getDb()
  if (!db) {
    return null
  }

  const userId = getSessionUserId()
  if (!userId) {
    return null
  }

  const userSnapshot = await getDoc(doc(db, usersCollectionName, userId))
  if (!userSnapshot.exists()) {
    return null
  }

  return userSnapshot.data() as UserSummaryRecord
}

export const createAccount = async (name: string, email: string, password: string): Promise<AuthResult> => {
  const db = getDb()
  if (!db) {
    return { ok: false, message: firebaseNotConfiguredMessage }
  }

  const normalizedEmail = email.trim().toLowerCase()
  const emailRef = doc(db, emailLookupCollectionName, normalizedEmail)
  const existingEmail = await getDoc(emailRef)
  if (existingEmail.exists()) {
    return { ok: false, message: 'Account already exists for this email.' }
  }

  const userId = createId()
  const auth: AuthUser = {
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    password: await hashPassword(password),
    createdAt: new Date().toISOString(),
  }

  const record: UserSummaryRecord = {
    auth,
    data: emptyData(),
  }

  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, usersCollectionName, userId)
    transaction.set(userRef, record)
    transaction.set(emailRef, { userId })
  })

  return { ok: true, message: 'Account created successfully.', userId }
}

export const login = async (email: string, password: string): Promise<AuthResult> => {
  const db = getDb()
  if (!db) {
    return { ok: false, message: firebaseNotConfiguredMessage }
  }

  const normalizedEmail = email.trim().toLowerCase()
  const emailSnapshot = await getDoc(doc(db, emailLookupCollectionName, normalizedEmail))

  if (!emailSnapshot.exists()) {
    return { ok: false, message: 'No account found for this email.' }
  }

  const { userId } = emailSnapshot.data() as { userId: string }
  const userSnapshot = await getDoc(doc(db, usersCollectionName, userId))
  if (!userSnapshot.exists()) {
    return { ok: false, message: 'No account found for this email.' }
  }

  const user = userSnapshot.data() as UserSummaryRecord
  const incomingHash = await hashPassword(password)

  if (user.auth.password !== incomingHash) {
    return { ok: false, message: 'Invalid password.' }
  }

  return { ok: true, message: `Welcome back, ${user.auth.name}.`, userId }
}

export const getUserRecord = async (userId: UserId): Promise<UserSummaryRecord | null> => {
  const db = getDb()
  if (!db) {
    return null
  }

  const userSnapshot = await getDoc(doc(db, usersCollectionName, userId))
  if (!userSnapshot.exists()) {
    return null
  }

  return userSnapshot.data() as UserSummaryRecord
}

const saveUserData = async (
  userId: UserId,
  updater: (existing: FinanceData) => FinanceData,
): Promise<UserSummaryRecord | null> => {
  const db = getDb()
  if (!db) {
    return null
  }

  return runTransaction(db, async (transaction) => {
    const userRef = doc(db, usersCollectionName, userId)
    const userSnapshot = await transaction.get(userRef)

    if (!userSnapshot.exists()) {
      return null
    }

    const existing = userSnapshot.data() as UserSummaryRecord
    const updated: UserSummaryRecord = {
      ...existing,
      data: updater(existing.data),
    }

    transaction.set(userRef, updated)
    return updated
  })
}

export const addTransaction = async (userId: UserId, input: TransactionInput): Promise<Transaction | null> => {
  const transactionRecord: Transaction = {
    ...input,
    id: createId(),
  }

  const updated = await saveUserData(userId, (existing) => ({
    ...existing,
    transactions: [transactionRecord, ...existing.transactions],
    budgets: existing.budgets.map((budget) =>
      budget.category.toLowerCase() === input.category.toLowerCase() && input.kind === 'expense'
        ? { ...budget, spent: budget.spent + input.amount }
        : budget,
    ),
  }))

  return updated ? transactionRecord : null
}

export const addBudget = async (userId: UserId, input: BudgetInput): Promise<Budget | null> => {
  const budget: Budget = {
    id: createId(),
    category: input.category,
    limit: input.limit,
    spent: 0,
    createdAt: new Date().toISOString(),
  }

  const updated = await saveUserData(userId, (existing) => ({
    ...existing,
    budgets: [budget, ...existing.budgets],
  }))

  return updated ? budget : null
}

export const updateBudget = async (userId: UserId, budgetId: string, input: BudgetInput): Promise<Budget | null> => {
  let updatedBudget: Budget | null = null

  const updated = await saveUserData(userId, (existing) => ({
    ...existing,
    budgets: existing.budgets.map((budget) => {
      if (budget.id !== budgetId) {
        return budget
      }

      updatedBudget = {
        ...budget,
        category: input.category,
        limit: input.limit,
      }

      return updatedBudget
    }),
  }))

  return updated ? updatedBudget : null
}

export const deleteBudget = async (userId: UserId, budgetId: string): Promise<boolean> => {
  let removed = false

  const updated = await saveUserData(userId, (existing) => ({
    ...existing,
    budgets: existing.budgets.filter((budget) => {
      if (budget.id !== budgetId) {
        return true
      }

      removed = true
      return false
    }),
  }))

  return Boolean(updated && removed)
}

export const restoreBudget = async (userId: UserId, budget: Budget): Promise<boolean> => {
  let restored = false

  const updated = await saveUserData(userId, (existing) => {
    const alreadyExists = existing.budgets.some((item) => item.id === budget.id)
    if (alreadyExists) {
      return existing
    }

    restored = true
    return {
      ...existing,
      budgets: [budget, ...existing.budgets],
    }
  })

  return Boolean(updated && restored)
}

export const addPot = async (userId: UserId, input: PotInput): Promise<Pot | null> => {
  const pot: Pot = {
    id: createId(),
    name: input.name,
    target: input.target,
    current: input.current,
    createdAt: new Date().toISOString(),
  }

  const updated = await saveUserData(userId, (existing) => ({
    ...existing,
    pots: [pot, ...existing.pots],
  }))

  return updated ? pot : null
}

export const updatePot = async (userId: UserId, potId: string, input: PotInput): Promise<Pot | null> => {
  let updatedPot: Pot | null = null

  const updated = await saveUserData(userId, (existing) => ({
    ...existing,
    pots: existing.pots.map((pot) => {
      if (pot.id !== potId) {
        return pot
      }

      updatedPot = {
        ...pot,
        name: input.name,
        target: input.target,
        current: input.current,
      }

      return updatedPot
    }),
  }))

  return updated ? updatedPot : null
}

export const deletePot = async (userId: UserId, potId: string): Promise<boolean> => {
  let removed = false

  const updated = await saveUserData(userId, (existing) => ({
    ...existing,
    pots: existing.pots.filter((pot) => {
      if (pot.id !== potId) {
        return true
      }

      removed = true
      return false
    }),
  }))

  return Boolean(updated && removed)
}

export const restorePot = async (userId: UserId, pot: Pot): Promise<boolean> => {
  let restored = false

  const updated = await saveUserData(userId, (existing) => {
    const alreadyExists = existing.pots.some((item) => item.id === pot.id)
    if (alreadyExists) {
      return existing
    }

    restored = true
    return {
      ...existing,
      pots: [pot, ...existing.pots],
    }
  })

  return Boolean(updated && restored)
}

export const addRecurringBill = async (
  userId: UserId,
  input: RecurringBillInput,
): Promise<RecurringBill | null> => {
  const recurringBill: RecurringBill = {
    id: createId(),
    title: input.title,
    amount: input.amount,
    dueDay: input.dueDay,
    frequency: input.frequency,
    createdAt: new Date().toISOString(),
  }

  const updated = await saveUserData(userId, (existing) => ({
    ...existing,
    recurringBills: [recurringBill, ...existing.recurringBills],
  }))

  return updated ? recurringBill : null
}

export const updateRecurringBill = async (
  userId: UserId,
  recurringBillId: string,
  input: RecurringBillInput,
): Promise<RecurringBill | null> => {
  let updatedRecurringBill: RecurringBill | null = null

  const updated = await saveUserData(userId, (existing) => ({
    ...existing,
    recurringBills: existing.recurringBills.map((bill) => {
      if (bill.id !== recurringBillId) {
        return bill
      }

      updatedRecurringBill = {
        ...bill,
        title: input.title,
        amount: input.amount,
        dueDay: input.dueDay,
        frequency: input.frequency,
      }

      return updatedRecurringBill
    }),
  }))

  return updated ? updatedRecurringBill : null
}

export const deleteRecurringBill = async (userId: UserId, recurringBillId: string): Promise<boolean> => {
  let removed = false

  const updated = await saveUserData(userId, (existing) => ({
    ...existing,
    recurringBills: existing.recurringBills.filter((bill) => {
      if (bill.id !== recurringBillId) {
        return true
      }

      removed = true
      return false
    }),
  }))

  return Boolean(updated && removed)
}

export const restoreRecurringBill = async (userId: UserId, recurringBill: RecurringBill): Promise<boolean> => {
  let restored = false

  const updated = await saveUserData(userId, (existing) => {
    const alreadyExists = existing.recurringBills.some((item) => item.id === recurringBill.id)
    if (alreadyExists) {
      return existing
    }

    restored = true
    return {
      ...existing,
      recurringBills: [recurringBill, ...existing.recurringBills],
    }
  })

  return Boolean(updated && restored)
}

export const getAllUsers = async (): Promise<UserSummaryRecord[]> => {
  const db = getDb()
  if (!db) {
    return []
  }

  const snapshots = await getDocs(collection(db, usersCollectionName))
  return snapshots.docs.map((snapshot) => snapshot.data() as UserSummaryRecord)
}
