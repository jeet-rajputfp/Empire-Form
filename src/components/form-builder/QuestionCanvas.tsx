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

  const questionNum = fieldIndex + 1
  const isLayout = field.type === 'heading' || field.type === 'paragraph'

  return (
    <div className="flex-1 bg-gray-100 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-16 px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[480px] p-12 flex flex-col justify-center">
          {/* Logo */}
          {d.logo && (
            <div className="flex justify-center mb-8 -mt-2">
              <img src={d.logo} alt="Logo" className="max-h-16 object-contain" />
            </div>
          )}
          {isLayout ? (
            /* Welcome / Thank You screen */
            <div className="text-center">
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
                className="mt-4 text-gray-500 text-center w-full border-0 focus:outline-none bg-transparent resize-none placeholder:text-gray-300 text-lg"
                placeholder="Description (optional)"
                rows={2}
              />
            </div>
          ) : (
            /* Regular question */
            <div>
              <div className="flex items-start gap-3 mb-2">
                <span className="text-lg text-gray-400 pt-1 select-none">{questionNum}.</span>
                <div className="flex-1">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => onUpdate({ ...field, label: e.target.value })}
                    className="text-2xl font-medium text-gray-900 w-full border-0 focus:outline-none bg-transparent placeholder:text-gray-300"
                    placeholder="Question text here. Recall information with @"
                  />
                  <input
                    type="text"
                    value={field.description || ''}
                    onChange={(e) => onUpdate({ ...field, description: e.target.value })}
                    className="mt-1 text-gray-400 w-full border-0 focus:outline-none bg-transparent placeholder:text-gray-300 text-base"
                    placeholder="Description (optional)"
                  />
                </div>
              </div>

              <div className="mt-8 ml-8">
                {renderFieldPreview(field, onUpdate)}
              </div>
            </div>
          )}
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
