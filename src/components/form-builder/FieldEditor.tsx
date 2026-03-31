'use client'

import { FormField } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, GripVertical, Plus, X, ChevronUp, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface FieldEditorProps {
  field: FormField
  onUpdate: (field: FormField) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}

export function FieldEditor({
  field,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: FieldEditorProps) {
  const [expanded, setExpanded] = useState(false)

  const hasOptions = ['select', 'multiselect', 'checkbox', 'radio'].includes(field.type)

  function addOption() {
    const options = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`]
    onUpdate({ ...field, options })
  }

  function updateOption(index: number, value: string) {
    const options = [...(field.options || [])]
    options[index] = value
    onUpdate({ ...field, options })
  }

  function removeOption(index: number) {
    const options = (field.options || []).filter((_, i) => i !== index)
    onUpdate({ ...field, options })
  }

  const fieldTypeLabels: Record<string, string> = {
    text: 'Short Text',
    email: 'Email',
    number: 'Number',
    phone: 'Phone',
    textarea: 'Long Text',
    select: 'Dropdown',
    multiselect: 'Multi Select',
    checkbox: 'Checkboxes',
    radio: 'Radio Buttons',
    date: 'Date',
    time: 'Time',
    file: 'File Upload',
    rating: 'Rating',
    heading: 'Heading',
    paragraph: 'Paragraph',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 form-field-drag group">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-1">
          <GripVertical size={16} className="text-gray-300 cursor-grab" />
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-30"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-30"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
              {fieldTypeLabels[field.type] || field.type}
            </span>
            {field.required && (
              <span className="text-xs text-red-500 font-medium">Required</span>
            )}
          </div>

          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate({ ...field, label: e.target.value })}
            className="w-full text-base font-medium text-gray-900 border-0 border-b border-transparent hover:border-gray-200 focus:border-gray-400 focus:outline-none pb-1 bg-transparent transition-colors"
            placeholder="Field label"
          />

          {field.type !== 'heading' && field.type !== 'paragraph' && (
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })}
              className="w-full text-sm text-gray-400 border-0 border-b border-transparent hover:border-gray-200 focus:border-gray-300 focus:outline-none mt-1 pb-1 bg-transparent transition-colors"
              placeholder="Placeholder text (optional)"
            />
          )}

          {(field.type === 'heading' || field.type === 'paragraph') && (
            <textarea
              value={field.description || ''}
              onChange={(e) => onUpdate({ ...field, description: e.target.value })}
              className="w-full text-sm text-gray-500 border border-gray-200 rounded-lg p-2 mt-2 focus:border-gray-400 focus:outline-none resize-none bg-transparent"
              placeholder={field.type === 'heading' ? 'Section heading text...' : 'Paragraph text...'}
              rows={2}
            />
          )}

          {hasOptions && (
            <div className="mt-3 space-y-1.5">
              {(field.options || []).map((option, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded border border-gray-300 flex-shrink-0" />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="flex-1 text-sm border-0 border-b border-gray-200 focus:border-gray-400 focus:outline-none pb-0.5 bg-transparent"
                  />
                  <button
                    onClick={() => removeOption(i)}
                    className="text-gray-300 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={addOption}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-1"
              >
                <Plus size={14} />
                Add option
              </button>
            </div>
          )}

          {expanded && field.type !== 'heading' && field.type !== 'paragraph' && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
              <textarea
                value={field.description || ''}
                onChange={(e) => onUpdate({ ...field, description: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:border-gray-400 focus:outline-none resize-none"
                placeholder="Help text / description"
                rows={2}
              />
              {(field.type === 'text' || field.type === 'textarea') && (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Min length"
                    type="number"
                    value={field.validation?.minLength || ''}
                    onChange={(e) =>
                      onUpdate({
                        ...field,
                        validation: { ...field.validation, minLength: parseInt(e.target.value) || undefined },
                      })
                    }
                  />
                  <Input
                    label="Max length"
                    type="number"
                    value={field.validation?.maxLength || ''}
                    onChange={(e) =>
                      onUpdate({
                        ...field,
                        validation: { ...field.validation, maxLength: parseInt(e.target.value) || undefined },
                      })
                    }
                  />
                </div>
              )}
              {field.type === 'number' && (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Min value"
                    type="number"
                    value={field.validation?.min || ''}
                    onChange={(e) =>
                      onUpdate({
                        ...field,
                        validation: { ...field.validation, min: parseInt(e.target.value) || undefined },
                      })
                    }
                  />
                  <Input
                    label="Max value"
                    type="number"
                    value={field.validation?.max || ''}
                    onChange={(e) =>
                      onUpdate({
                        ...field,
                        validation: { ...field.validation, max: parseInt(e.target.value) || undefined },
                      })
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {field.type !== 'heading' && field.type !== 'paragraph' && (
            <>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer mr-2">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => onUpdate({ ...field, required: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Required
              </label>
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                title="Settings"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 14.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
