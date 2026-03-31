'use client'

import {
  Type, Mail, Hash, Phone, AlignLeft, ChevronDown, CheckSquare,
  Circle, Calendar, Clock, Upload, Star, Heading, FileText
} from 'lucide-react'
import { FieldType } from '@/types'

interface FieldOption {
  type: FieldType
  label: string
  icon: React.ReactNode
  category: string
}

const FIELD_OPTIONS: FieldOption[] = [
  { type: 'text', label: 'Short Text', icon: <Type size={18} />, category: 'Input' },
  { type: 'email', label: 'Email', icon: <Mail size={18} />, category: 'Input' },
  { type: 'number', label: 'Number', icon: <Hash size={18} />, category: 'Input' },
  { type: 'phone', label: 'Phone', icon: <Phone size={18} />, category: 'Input' },
  { type: 'textarea', label: 'Long Text', icon: <AlignLeft size={18} />, category: 'Input' },
  { type: 'date', label: 'Date', icon: <Calendar size={18} />, category: 'Input' },
  { type: 'time', label: 'Time', icon: <Clock size={18} />, category: 'Input' },
  { type: 'select', label: 'Dropdown', icon: <ChevronDown size={18} />, category: 'Choice' },
  { type: 'multiselect', label: 'Multi Select', icon: <CheckSquare size={18} />, category: 'Choice' },
  { type: 'checkbox', label: 'Checkboxes', icon: <CheckSquare size={18} />, category: 'Choice' },
  { type: 'radio', label: 'Radio', icon: <Circle size={18} />, category: 'Choice' },
  { type: 'rating', label: 'Rating', icon: <Star size={18} />, category: 'Choice' },
  { type: 'file', label: 'File Upload', icon: <Upload size={18} />, category: 'Other' },
  { type: 'heading', label: 'Heading', icon: <Heading size={18} />, category: 'Layout' },
  { type: 'paragraph', label: 'Paragraph', icon: <FileText size={18} />, category: 'Layout' },
]

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void
}

export function FieldPalette({ onAddField }: FieldPaletteProps) {
  const categories = Array.from(new Set(FIELD_OPTIONS.map((f) => f.category)))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Fields</h3>
      {categories.map((category) => (
        <div key={category} className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            {category}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {FIELD_OPTIONS.filter((f) => f.category === category).map((field) => (
              <button
                key={field.type}
                onClick={() => onAddField(field.type)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors text-left"
              >
                <span className="text-gray-400">{field.icon}</span>
                {field.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
