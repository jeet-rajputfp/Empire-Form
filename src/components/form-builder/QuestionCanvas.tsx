'use client'

import { FormField, FormDesign, DEFAULT_FORM_DESIGN } from '@/types'
import { Star } from 'lucide-react'

interface QuestionCanvasProps {
  field: FormField | null
  fieldIndex: number
  totalFields: number
  onUpdate: (field: FormField) => void
  design?: FormDesign
}

export function QuestionCanvas({ field, fieldIndex, totalFields, onUpdate, design }: QuestionCanvasProps) {
  const d = design || DEFAULT_FORM_DESIGN
  if (!field) {
    return (
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Add a question to get started</p>
        </div>
      </div>
    )
  }

  const isLayout = field.type === 'heading' || field.type === 'paragraph'

  return (
    <div className="flex-1 bg-gray-100 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto h-full min-h-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[calc(100vh-8rem)] p-10 flex flex-col">
          {/* Logo - top center inside card */}
          {d.logo && (
            <div className="flex justify-center pt-4 pb-2">
              <img src={d.logo} alt="Logo" className="max-h-14 object-contain" />
            </div>
          )}
          <div className="flex-1 flex flex-col justify-center px-4">
          {isLayout ? (
            /* Welcome / Thank You screen */
            <div className="text-center max-w-lg mx-auto">
              <input
                type="text"
                value={field.label}
                onChange={(e) => onUpdate({ ...field, label: e.target.value })}
                className="text-3xl font-bold text-gray-900 text-center w-full border-0 focus:outline-none bg-transparent placeholder:text-gray-300"
                placeholder={field.type === 'heading' ? 'Welcome!' : 'Thank you!'}
              />
              <textarea
                value={field.description || ''}
                onChange={(e) => onUpdate({ ...field, description: e.target.value })}
                className="mt-4 text-gray-600 text-center w-full border-0 focus:outline-none bg-transparent resize-none placeholder:text-gray-300 text-base leading-relaxed"
                placeholder="Description (optional)"
                rows={4}
              />
              {field.type === 'heading' && (
                <div className="mt-8">
                  <button className="bg-purple-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors">
                    Let&apos;s get started!
                  </button>
                  <p className="mt-3 text-xs text-gray-400">
                    press <span className="font-medium text-gray-500">Enter</span> ↵
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Regular question */
            <div className="max-w-xl">
              <div className="mb-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => onUpdate({ ...field, label: e.target.value })}
                    className="text-2xl font-medium text-gray-900 w-full border-0 focus:outline-none bg-transparent placeholder:text-gray-300"
                    placeholder="Question text here. Recall information with @"
                  />
                  <textarea
                    value={field.description || ''}
                    onChange={(e) => onUpdate({ ...field, description: e.target.value })}
                    className="mt-2 text-gray-500 w-full border-0 focus:outline-none bg-transparent placeholder:text-gray-300 text-sm leading-relaxed resize-none"
                    placeholder="Description (optional)"
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-6 ml-8">
                {renderFieldPreview(field, onUpdate)}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

function renderFieldPreview(field: FormField, onUpdate: (f: FormField) => void) {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'number':
      return (
        <div className="border-b-2 border-gray-200 pb-2 max-w-md">
          <span className="text-gray-300 text-lg">{field.placeholder || 'Type your answer here...'}</span>
        </div>
      )

    case 'textarea':
      return (
        <div className="border-b-2 border-gray-200 pb-2">
          <span className="text-gray-300 text-lg">{field.placeholder || 'Type your answer here...'}</span>
        </div>
      )

    case 'date':
      return (
        <div className="flex items-center gap-3 max-w-xs">
          <div className="flex-1 border-b-2 border-gray-200 pb-2 text-center">
            <span className="text-gray-300">MM</span>
          </div>
          <span className="text-gray-300">/</span>
          <div className="flex-1 border-b-2 border-gray-200 pb-2 text-center">
            <span className="text-gray-300">DD</span>
          </div>
          <span className="text-gray-300">/</span>
          <div className="flex-1 border-b-2 border-gray-200 pb-2 text-center">
            <span className="text-gray-300">YYYY</span>
          </div>
        </div>
      )

    case 'time':
      return (
        <div className="flex items-center gap-3 max-w-xs">
          <div className="flex-1 border-b-2 border-gray-200 pb-2 text-center">
            <span className="text-gray-300">HH</span>
          </div>
          <span className="text-gray-300">:</span>
          <div className="flex-1 border-b-2 border-gray-200 pb-2 text-center">
            <span className="text-gray-300">MM</span>
          </div>
        </div>
      )

    case 'select':
      return (
        <div className="space-y-2 max-w-md">
          {(field.options || []).map((opt, i) => (
            <div key={i} className="flex items-center gap-3 group">
              <span className="w-6 h-6 rounded border-2 border-gray-200 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const opts = [...(field.options || [])]
                  opts[i] = e.target.value
                  onUpdate({ ...field, options: opts })
                }}
                className="flex-1 text-gray-700 border-0 focus:outline-none bg-transparent"
              />
            </div>
          ))}
          <button
            onClick={() => {
              const opts = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`]
              onUpdate({ ...field, options: opts })
            }}
            className="text-sm text-gray-400 hover:text-gray-600 mt-2"
          >
            + Add option
          </button>
        </div>
      )

    case 'radio':
    case 'checkbox':
    case 'multiselect':
      return (
        <div className="space-y-2 max-w-md">
          {(field.options || []).map((opt, i) => (
            <div key={i} className="flex items-center gap-3 group">
              <span className={`w-6 h-6 ${field.type === 'radio' ? 'rounded-full' : 'rounded'} border-2 border-gray-200 flex items-center justify-center text-xs text-gray-400 flex-shrink-0`}>
                {String.fromCharCode(65 + i)}
              </span>
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const opts = [...(field.options || [])]
                  opts[i] = e.target.value
                  onUpdate({ ...field, options: opts })
                }}
                className="flex-1 text-gray-700 border-0 focus:outline-none bg-transparent"
              />
            </div>
          ))}
          <button
            onClick={() => {
              const opts = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`]
              onUpdate({ ...field, options: opts })
            }}
            className="text-sm text-gray-400 hover:text-gray-600 mt-2"
          >
            + Add option
          </button>
        </div>
      )

    case 'rating':
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} size={32} className="text-gray-200" />
          ))}
        </div>
      )

    case 'file':
      return (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center max-w-md">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-gray-400 text-lg">+</span>
          </div>
          <p className="text-sm text-gray-400">Drag and drop or click to upload</p>
        </div>
      )

    default:
      return (
        <div className="border-b-2 border-gray-200 pb-2 max-w-md">
          <span className="text-gray-300 text-lg">{field.placeholder || 'Type your answer here...'}</span>
        </div>
      )
  }
}
