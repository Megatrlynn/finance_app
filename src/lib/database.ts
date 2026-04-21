import { initializeApp } from 'firebase/app'
import {
  doc,
  getDoc,
  getDocs,
  collection,
  runTransaction,
  getFirestore,
  setDoc,
  type Firestore,
} from 'firebase/firestore'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth'
import type {
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
let firebaseAuth: Auth | null = null

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

const getAuth_ = (): Auth | null => {
  if (!isFirebaseConfigured) {
    return null
  }

  if (!firebaseAuth) {
    const app = initializeApp(firebaseConfig)
    firebaseAuth = getAuth(app)
  }

  return firebaseAuth
}

const usersCollectionName = 'users'

const firebaseNotConfiguredMessage =
  'Firebase is not configured. Add VITE_FIREBASE_* variables before using cloud storage.'

interface UserFinanceRecord {
  data: FinanceData
  userEmail: string
  createdAt: string
}

export interface AuthResult {
  ok: boolean
  message: string
  userId?: UserId
}

export interface UserSummaryRecord {
  data: FinanceData
  email: string
}

export const createAccount = async (name: string, email: string, password: string): Promise<AuthResult> => {
  const auth = getAuth_()
  const db = getDb()

  if (!auth || !db) {
    return { ok: false, message: firebaseNotConfiguredMessage }
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password)
    const userId = userCredential.user.uid

    const record: UserFinanceRecord = {
      data: emptyData(),
      userEmail: email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    }

    await setDoc(doc(db, usersCollectionName, userId), record)

    return { ok: true, message: `Welcome, ${name.trim()}!`, userId }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create account.'
    return { ok: false, message }
  }
}

export const login = async (email: string, password: string): Promise<AuthResult> => {
  const auth = getAuth_()

  if (!auth) {
    return { ok: false, message: firebaseNotConfiguredMessage }
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password)
    const userId = userCredential.user.uid
    return { ok: true, message: 'Logged in successfully.', userId }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed.'
    return { ok: false, message }
  }
}

export const logout = async (): Promise<void> => {
  const auth = getAuth_()
  if (!auth) {
    return
  }

  try {
    await signOut(auth)
  } catch (error) {
    console.error('Logout error:', error)
  }
}

export const onAuthChange = (callback: (user: FirebaseUser | null) => void): (() => void) => {
  const auth = getAuth_()
  if (!auth) {
    callback(null)
    return () => {}
  }

  return onAuthStateChanged(auth, callback)
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

  const docData = userSnapshot.data() as UserFinanceRecord
  return {
    data: docData.data,
    email: docData.userEmail,
  }
}

const saveUserData = async (
  userId: UserId,
  updater: (existing: FinanceData) => FinanceData,
): Promise<UserFinanceRecord | null> => {
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

    const existing = userSnapshot.data() as UserFinanceRecord
    const updated: UserFinanceRecord = {
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

export const getAllUsers = async (): Promise<UserFinanceRecord[]> => {
  const db = getDb()
  if (!db) {
    return []
  }

  const snapshots = await getDocs(collection(db, usersCollectionName))
  return snapshots.docs.map((snapshot) => snapshot.data() as UserFinanceRecord)
}
