'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useLanguage } from '@/app/providers'

type Product = {
  id: string
  name: string
  defaultPrice: number
}

type ProductComboboxProps = {
  products: Product[]
  value: string
  onChange: (val: string, product?: Product) => void
  placeholder?: string
  error?: boolean
}

export default function ProductCombobox({ products, value, onChange, placeholder, error }: ProductComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  const filtered = products.filter(p => p.name.toLowerCase().includes(value.toLowerCase()))

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && e.key === 'ArrowDown') {
      setIsOpen(true)
      return
    }

    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < filtered.length) {
          const product = filtered[activeIndex]
          onChange(product.name, product)
          setIsOpen(false)
        } else {
          onChange(value) // keep what they typed
          setIsOpen(false)
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="text"
        className={`w-full rounded-xl border px-3 py-2 text-sm bg-transparent transition ${
          error ? 'border-status-cancelled focus:ring-status-cancelled' : 'border-border focus:border-black dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white'
        }`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setIsOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="products-listbox"
        aria-activedescendant={activeIndex >= 0 ? `product-option-${activeIndex}` : undefined}
      />
      {isOpen && filtered.length > 0 && (
        <ul
          id="products-listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-card shadow-lg"
          role="listbox"
        >
          {filtered.map((product, index) => (
            <li
              key={product.id}
              id={`product-option-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              className={`flex cursor-pointer items-center justify-between px-4 py-2 text-sm transition ${
                activeIndex === index ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'
              }`}
              onClick={() => {
                onChange(product.name, product)
                setIsOpen(false)
              }}
            >
              <span className="font-medium text-text-primary">{product.name}</span>
              <span className="text-text-secondary">{product.defaultPrice.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
