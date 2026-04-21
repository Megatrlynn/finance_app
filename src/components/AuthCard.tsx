import { AnimatePresence, motion } from 'framer-motion'
import { Lock, Mail, Search, ShieldCheck, Sparkles, TrendingUp, User } from 'lucide-react'

export type AuthMode = 'login' | 'signup'

export interface AuthValues {
  name: string
  email: string
  password: string
}

interface AuthCardProps {
  mode: AuthMode
  values: AuthValues
  onModeChange: (mode: AuthMode) => void
  onFieldChange: (field: keyof AuthValues, value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
  isBusy: boolean
}

const container = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      staggerChildren: 0.08,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
}

function FloatingField(props: {
  id: string
  type: string
  label: string
  value: string
  onChange: (value: string) => void
  icon: React.ReactNode
  minLength?: number
}) {
  return (
    <motion.label variants={item} htmlFor={props.id} className="relative block">
      <span className="pointer-events-none absolute left-3 top-3 text-slate-400">{props.icon}</span>

      <input
        id={props.id}
        required
        minLength={props.minLength}
        type={props.type}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        placeholder=" "
        className="peer h-13 w-full rounded-2xl border border-slate-300 bg-white/85 pl-10 pr-4 pt-5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />

      <span className="pointer-events-none absolute left-10 top-4 origin-left text-sm text-slate-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:scale-75 peer-focus:text-emerald-700 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:scale-75">
        {props.label}
      </span>
    </motion.label>
  )
}

export function AuthCard({ mode, values, onModeChange, onFieldChange, onSubmit, isBusy }: AuthCardProps) {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-[1.05fr_0.95fr]">
      <motion.aside
        variants={container}
        initial="hidden"
        animate="visible"
        className="rounded-3xl border border-slate-300 bg-white/70 p-6 shadow-2xl backdrop-blur-xl"
      >
        <motion.p variants={item} className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
          <Sparkles size={14} />
          Personal Finance App
        </motion.p>

        <motion.h1 variants={item} className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          See where your money goes.
        </motion.h1>

        <motion.p variants={item} className="mb-5 text-sm leading-7 text-slate-600">
          Track daily spending, stay within budget, grow savings pots, and keep recurring bills under control in one clear dashboard.
        </motion.p>

        <motion.div variants={item} className="rounded-2xl border border-slate-300 bg-slate-50/80 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">What You Can Do</p>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-center gap-2"><TrendingUp size={16} /> Monitor income, expenses, and balance trends</li>
            <li className="flex items-center gap-2"><Search size={16} /> Find records fast with focused search and filters</li>
            <li className="flex items-center gap-2"><ShieldCheck size={16} /> Edit, delete, and undo key budget and savings actions</li>
          </ul>
        </motion.div>
      </motion.aside>

      <motion.section
        variants={container}
        initial="hidden"
        animate="visible"
        className="rounded-3xl border border-slate-300 bg-white/80 p-6 shadow-2xl backdrop-blur-xl"
      >
        <motion.div variants={item} className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Authentication</p>
            <h2 className="text-2xl font-bold text-slate-900">{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {mode === 'signup'
                ? 'Start tracking transactions, budgets, pots and more.'
                : 'Sign in to continue managing your money.'}
            </p>
          </div>

          <div className="inline-flex rounded-full border border-slate-300 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => onModeChange('signup')}
              className={mode === 'signup' ? 'rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white' : 'rounded-full px-4 py-1.5 text-xs font-semibold text-slate-600'}
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={() => onModeChange('login')}
              className={mode === 'login' ? 'rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white' : 'rounded-full px-4 py-1.5 text-xs font-semibold text-slate-600'}
            >
              Log in
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            variants={container}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: 10 }}
            onSubmit={onSubmit}
            className="space-y-3"
          >
            {mode === 'signup' ? (
              <FloatingField
                id="auth-name"
                type="text"
                label="Full Name"
                value={values.name}
                minLength={2}
                onChange={(value) => onFieldChange('name', value)}
                icon={<User size={16} />}
              />
            ) : null}

            <FloatingField
              id="auth-email"
              type="email"
              label="Email"
              value={values.email}
              onChange={(value) => onFieldChange('email', value)}
              icon={<Mail size={16} />}
            />

            <FloatingField
              id="auth-password"
              type="password"
              label="Password"
              value={values.password}
              minLength={4}
              onChange={(value) => onFieldChange('password', value)}
              icon={<Lock size={16} />}
            />

            <motion.button
              variants={item}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={isBusy}
              type="submit"
              className="h-12 w-full rounded-2xl bg-emerald-500 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600 disabled:opacity-70"
            >
              {isBusy ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Log in'}
            </motion.button>
          </motion.form>
        </AnimatePresence>
      </motion.section>
    </div>
  )
}
