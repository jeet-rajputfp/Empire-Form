'use client'

import { cn } from '@/lib/utils'
import { MoreHorizontal } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface DropdownItem {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  variant?: 'default' | 'danger'
  separator?: boolean
}

interface DropdownProps {
  items: DropdownItem[]
  trigger?: React.ReactNode
}

export function Dropdown({ items, trigger }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {trigger || <MoreHorizontal size={18} className="text-gray-400" />}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-gray-100 py-1.5 min-w-[200px] z-[100]">
          {items.map((item, i) => (
            <div key={i}>
              {item.separator && <div className="my-1.5 border-t border-gray-100" />}
              <button
                onClick={(e) => { e.stopPropagation(); item.onClick(); setOpen(false) }}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors text-left',
                  item.variant === 'danger' ? 'text-red-500 hover:bg-red-50' : 'text-gray-700'
                )}
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
