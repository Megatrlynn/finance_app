import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

export interface CategoryOption {
  value: string
  label: string
  icon: LucideIcon
}

interface CategoryDropdownProps {
  label: string
  placeholder: string
  value: string
  options: CategoryOption[]
  onChange: (value: string) => void
}

export function CategoryDropdown({
  label,
  placeholder,
  value,
  options,
  onChange,
}: CategoryDropdownProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) {
        return
      }

      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const active = options.find((option) => option.value === value)

  return (
    <div ref={wrapperRef} className="relative">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={clsx(
          'flex w-full items-center justify-between rounded-2xl border border-slate-300 bg-white/85 px-4 py-3 text-left text-sm shadow-sm backdrop-blur-md transition',
          open ? 'ring-4 ring-emerald-100' : 'hover:border-slate-400',
        )}
      >
        <span className="flex items-center gap-2 text-slate-700">
          {active ? <active.icon size={16} /> : null}
          {active?.label ?? placeholder}
        </span>

        <ChevronDown
          size={18}
          className={clsx('text-slate-500 transition-transform', open ? 'rotate-180' : 'rotate-0')}
        />
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-300 bg-white/95 p-2 shadow-xl backdrop-blur-lg"
          >
            {options.map((option) => {
              const Icon = option.icon
              const selected = option.value === value

              return (
                <motion.li key={option.value} whileHover={{ x: 3 }} className="mb-1 last:mb-0">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                    className={clsx(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition',
                      selected
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon size={16} />
                      {option.label}
                    </span>

                    {selected ? <Check size={16} /> : null}
                  </button>
                </motion.li>
              )
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
