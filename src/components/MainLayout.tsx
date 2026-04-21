import { motion } from 'framer-motion'
import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'

export interface NavTab {
  id: string
  label: string
  icon: LucideIcon
}

interface MainLayoutProps {
  tabs: NavTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  title: string
  subtitle: string
  rightSlot?: React.ReactNode
  children: React.ReactNode
}

export function MainLayout({
  tabs,
  activeTab,
  onTabChange,
  title,
  subtitle,
  rightSlot,
  children,
}: MainLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-3 pb-26 pt-3 md:px-5 md:pb-6">
      <header className="mb-3 rounded-3xl border border-slate-300 bg-white/80 p-4 shadow-xl backdrop-blur-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{title}</h1>
            <p className="text-sm text-slate-600">{subtitle}</p>
          </div>
          {rightSlot}
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = tab.id === activeTab

            return (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                type="button"
                className={clsx(
                  'relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition',
                  active ? 'text-emerald-800' : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="desktop-active-tab"
                    className="absolute inset-0 rounded-xl bg-emerald-100"
                    transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                  />
                ) : null}
                <Icon size={16} className="relative" />
                <span className="relative">{tab.label}</span>
              </motion.button>
            )
          })}
        </nav>
      </header>

      <main>{children}</main>

      <nav className="fixed bottom-4 left-1/2 z-30 w-[min(560px,calc(100%-1rem))] -translate-x-1/2 rounded-3xl border border-slate-300 bg-white/90 p-1.5 shadow-2xl backdrop-blur-xl md:hidden">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = tab.id === activeTab

            return (
              <motion.button
                whileTap={{ scale: 0.95 }}
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                type="button"
                className={clsx(
                  'relative flex min-h-13 flex-col items-center justify-center rounded-2xl px-1 text-[11px] font-semibold leading-tight',
                  active ? 'text-emerald-800' : 'text-slate-500',
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="mobile-active-tab"
                    className="absolute inset-0 rounded-2xl bg-emerald-100"
                    transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                  />
                ) : null}
                <Icon size={18} className="relative" />
                <span className="relative mt-1 whitespace-nowrap">{tab.label}</span>
              </motion.button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
