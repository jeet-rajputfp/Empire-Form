'use client'

import { useState, useRef, useEffect } from 'react'
import { FormField, FieldType } from '@/types'
import { Plus, GripVertical, Copy, Trash2, ChevronDown, X } from 'lucide-react'
import {
  Type, AlignLeft, Calendar, Hash, CheckSquare,
  ChevronDown as DropdownIcon, Image, Upload, Mail,
  Phone, Globe, ArrowRightFromLine, ArrowLeftFromLine, Star
} from 'lucide-react'

const FIELD_TYPE_CONFIG: {
  type: FieldType
  label: string
  icon: React.ReactNode
  color: string
  category: 'input' | 'choice' | 'special' | 'layout'
}[] = [
  { type: 'text', label: 'Short Text', icon: <Type size={14} />, color: 'bg-emerald-500', category: 'input' },
  { type: 'textarea', label: 'Long Text', icon: <AlignLeft size={14} />, color: 'bg-emerald-500', category: 'input' },
  { type: 'date', label: 'Date And Time', icon: <Calendar size={14} />, color: 'bg-blue-500', category: 'input' },
  { type: 'number', label: 'Number', icon: <Hash size={14} />, color: 'bg-blue-500', category: 'input' },
  { type: 'radio', label: 'Multiple Choice', icon: <CheckSquare size={14} />, color: 'bg-rose-500', category: 'choice' },
  { type: 'select', label: 'Dropdown', icon: <ChevronDown size={14} />, color: 'bg-rose-500', category: 'choice' },
  { type: 'checkbox', label: 'Checkboxes', icon: <CheckSquare size={14} />, color: 'bg-rose-500', category: 'choice' },
  { type: 'rating', label: 'Rating', icon: <Star size={14} />, color: 'bg-amber-500', category: 'choice' },
  { type: 'heading', label: 'Welcome Screen', icon: <ArrowRightFromLine size={14} />, color: 'bg-gray-500', category: 'layout' },
  { type: 'paragraph', label: 'Thank You Screen', icon: <ArrowLeftFromLine size={14} />, color: 'bg-gray-500', category: 'layout' },
  { type: 'email', label: 'Email', icon: <Mail size={14} />, color: 'bg-teal-500', category: 'special' },
  { type: 'phone', label: 'Phone Number', icon: <Phone size={14} />, color: 'bg-teal-500', category: 'special' },
  { type: 'file', label: 'File Upload', icon: <Upload size={14} />, color: 'bg-green-600', category: 'special' },
]

function getFieldConfig(type: FieldType) {
  return FIELD_TYPE_CONFIG.find((f) => f.type === type) || FIELD_TYPE_CONFIG[0]
}

interface QuestionSidebarProps {
  fields: FormField[]
  selectedFieldId: string | null
  onSelectField: (id: string) => void
  onAddField: (type: FieldType) => void
  onDeleteField: (id: string) => void
  onMoveField: (id: string, direction: 'up' | 'down') => void
  onDuplicateField: (id: string) => void
}

export function QuestionSidebar({
  fields,
  selectedFieldId,
  onSelectField,
  onAddField,
  onDeleteField,
  onMoveField,
  onDuplicateField,
}: QuestionSidebarProps) {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const welcomeScreens = fields.filter((f) => f.type === 'heading')
  const questions = fields.filter((f) => f.type !== 'heading' && f.type !== 'paragraph')
  const endings = fields.filter((f) => f.type === 'paragraph')

  return (
    <div className="w-48 border-r border-gray-200 flex flex-col bg-gray-50/50 flex-shrink-0">
      {/* Questions header */}
      <div className="px-3 pt-4 pb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Questions</span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
          >
            <Plus size={14} />
          </button>

          {showAddMenu && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
              {(['input', 'choice', 'special', 'layout'] as const).map((category) => {
                const items = FIELD_TYPE_CONFIG.filter((f) => f.category === category)
                if (items.length === 0) return null
                return (
                  <div key={category}>
                    {items.map((item) => (
                      <button
                        key={item.type}
                        onClick={() => {
                          onAddField(item.type)
                          setShowAddMenu(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <span className={`w-7 h-7 ${item.color} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                          {item.icon}
                        </span>
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </button>
                    ))}
                    {category !== 'layout' && <div className="my-1 border-t border-gray-100" />}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Welcome Screens - at the top */}
      {welcomeScreens.length > 0 && (
        <div className="px-2 pb-1 space-y-1">
          {welcomeScreens.map((field) => {
            const config = getFieldConfig(field.type)
            const isSelected = field.id === selectedFieldId
            return (
              <button
                key={field.id}
                onClick={() => onSelectField(field.id)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors group ${
                  isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100 border border-transparent'
                }`}
              >
                <span className={`w-6 h-6 ${config.color} rounded flex items-center justify-center text-white flex-shrink-0`}>
                  {config.icon}
                </span>
                <span className="text-xs text-gray-600 truncate flex-1">Welcome</span>
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); onDeleteField(field.id) }}
                  className="hidden group-hover:flex w-5 h-5 items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                >
                  <X size={12} />
                </span>
              </button>
            )
          })}
          <div className="border-b border-gray-200 mx-1" />
        </div>
      )}

      {/* Questions list - in the middle */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
        {questions.map((field, idx) => {
          const config = getFieldConfig(field.type)
          const isSelected = field.id === selectedFieldId
          return (
            <button
              key={field.id}
              onClick={() => onSelectField(field.id)}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors group ${
                isSelected
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-100 border border-transparent'
              }`}
            >
              <span className={`w-6 h-6 ${config.color} rounded flex items-center justify-center text-white flex-shrink-0 text-xs`}>
                {config.icon}
              </span>
              <span className="text-xs text-gray-700 truncate flex-1 font-medium">
                {field.label || 'Untitled'}
              </span>
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onDeleteField(field.id) }}
                className="hidden group-hover:flex w-5 h-5 items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0 transition-colors"
              >
                <X size={12} />
              </span>
            </button>
          )
        })}
      </div>

      {/* Endings (Thank You Screens) - at the bottom */}
      <div className="border-t border-gray-200 px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Endings</span>
          <button
            onClick={() => onAddField('paragraph')}
            className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200"
          >
            <Plus size={12} />
          </button>
        </div>
        {endings.length > 0 && (
          <div className="space-y-1">
            {endings.map((field) => {
              const config = getFieldConfig(field.type)
              const isSelected = field.id === selectedFieldId
              return (
                <button
                  key={field.id}
                  onClick={() => onSelectField(field.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors group ${
                    isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <span className={`w-5 h-5 ${config.color} rounded flex items-center justify-center text-white flex-shrink-0`}>
                    {config.icon}
                  </span>
                  <span className="text-xs text-gray-600 truncate flex-1">Thank You</span>
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteField(field.id) }}
                    className="hidden group-hover:flex w-5 h-5 items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                  >
                    <X size={12} />
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
