'use client'

import { useTheme } from '@/app/providers'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
}
