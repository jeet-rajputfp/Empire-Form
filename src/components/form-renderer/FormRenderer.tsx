'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { FormField, FormSettings } from '@/types'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, Save, Star, Upload, X } from 'lucide-react'

interface FormRendererProps {
  formId: string
  title: string
  description?: string
  fields: FormField[]
  settings: FormSettings
}

export function FormRenderer({ formId, title, description, fields, settings }: FormRendererProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [responseId, setResponseId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({})
  const pendingChanges = useRef(false)
  const autoSaveTimer = useRef<NodeJS.Timeout>(null)

  // Restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`form-${formId}-session`)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setAnswers(data.answers || {})
        setResponseId(data.responseId || null)
      } catch {}
    }
  }, [formId])

  // Save session to localStorage on every change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(
        `form-${formId}-session`,
        JSON.stringify({ answers, responseId })
      )
    }
  }, [answers, responseId, formId])

  // Auto-save to server
  const autoSave = useCallback(async () => {
    if (!settings.enableAutoSave || Object.keys(answers).length === 0) return

    setAutoSaveStatus('saving')
    try {
      const res = await fetch('/api/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId, responseId, answers }),
      })

      if (res.ok) {
        const data = await res.json()
        if (!responseId) setResponseId(data.responseId)
        setLastSavedAt(new Date(data.savedAt))
        setAutoSaveStatus('saved')
        pendingChanges.current = false

        // Update localStorage with responseId
        localStorage.setItem(
          `form-${formId}-session`,
          JSON.stringify({ answers, responseId: data.responseId })
        )
      } else {
        setAutoSaveStatus('error')
      }
    } catch {
      setAutoSaveStatus('error')
    }

    // Reset status after 2s
    setTimeout(() => setAutoSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 2000)
  }, [formId, responseId, answers, settings.enableAutoSave])

  // Trigger auto-save on changes with debounce
  useEffect(() => {
    if (!settings.enableAutoSave || submitted) return
    pendingChanges.current = true

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(autoSave, settings.autoSaveInterval || 3000)

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [answers, settings.enableAutoSave, settings.autoSaveInterval, autoSave, submitted])

  // Save on page unload
  useEffect(() => {
    function handleBeforeUnload() {
      if (pendingChanges.current && Object.keys(answers).length > 0) {
        navigator.sendBeacon(
          '/api/autosave',
          JSON.stringify({ formId, responseId, answers })
        )
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [formId, responseId, answers])

  function updateAnswer(fieldId: string, value: any) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
    // Clear error on change
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    for (const field of fields) {
      if (field.type === 'heading' || field.type === 'paragraph') continue
      const value = answers[field.id]

      if (field.required && (value === undefined || value === '' || value === null)) {
        newErrors[field.id] = 'This field is required'
        continue
      }
      if (!value) continue

      if (field.validation?.minLength && String(value).length < field.validation.minLength) {
        newErrors[field.id] = `Minimum ${field.validation.minLength} characters`
      }
      if (field.validation?.maxLength && String(value).length > field.validation.maxLength) {
        newErrors[field.id] = `Maximum ${field.validation.maxLength} characters`
      }
      if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        newErrors[field.id] = 'Please enter a valid email'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/forms/${formId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, responseId }),
      })

      if (res.ok) {
        setSubmitted(true)
        localStorage.removeItem(`form-${formId}-session`)
      }
    } catch (err) {
      console.error('Submit error:', err)
    }
    setSubmitting(false)
  }

  async function handleFileUpload(fieldId: string, file: File) {
    if (!responseId) {
      // Create response first
      setAutoSaveStatus('saving')
      const res = await fetch('/api/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId, responseId: null, answers }),
      })
      if (res.ok) {
        const data = await res.json()
        setResponseId(data.responseId)
        await uploadFile(fieldId, file, data.responseId)
      }
    } else {
      await uploadFile(fieldId, file, responseId)
    }
  }

  async function uploadFile(fieldId: string, file: File, resId: string) {
    setUploadingFiles((prev) => ({ ...prev, [fieldId]: true }))
    const formData = new FormData()
    formData.append('file', file)
    formData.append('responseId', resId)
    formData.append('fieldId', fieldId)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        updateAnswer(fieldId, { filename: data.originalName, path: data.path, id: data.id })
      }
    } catch (err) {
      console.error('Upload error:', err)
    }
    setUploadingFiles((prev) => ({ ...prev, [fieldId]: false }))
  }

  // Calculate progress
  const inputFields = fields.filter((f) => f.type !== 'heading' && f.type !== 'paragraph')
  const answeredCount = inputFields.filter(
    (f) => answers[f.id] !== undefined && answers[f.id] !== '' && answers[f.id] !== null
  ).length
  const progress = inputFields.length > 0 ? Math.round((answeredCount / inputFields.length) * 100) : 0

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Response Submitted!</h2>
        <p className="text-gray-600">{settings.successMessage}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Logo - top center */}
      {settings.design?.logo && (
        <div className="flex justify-center mb-8">
          <img src={settings.design.logo} alt="Logo" className="max-h-12 object-contain" />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        {description && <p className="text-gray-600">{description}</p>}
      </div>

      {/* Progress bar */}
      {settings.showProgressBar && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Progress</span>
            <span className="text-xs text-gray-500">{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Auto-save indicator */}
      {settings.enableAutoSave && (
        <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
          {autoSaveStatus === 'saving' && (
            <>
              <Loader2 size={12} className="animate-spin" />
              Saving...
            </>
          )}
          {autoSaveStatus === 'saved' && (
            <>
              <Save size={12} className="text-green-500" />
              <span className="text-green-600">Saved</span>
            </>
          )}
          {autoSaveStatus === 'error' && (
            <>
              <X size={12} className="text-red-500" />
              <span className="text-red-500">Save failed - will retry</span>
            </>
          )}
          {autoSaveStatus === 'idle' && lastSavedAt && (
            <>
              <Save size={12} />
              Last saved {lastSavedAt.toLocaleTimeString()}
            </>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map((field) => (
          <div key={field.id}>
            {renderField(field, answers[field.id], (v) => updateAnswer(field.id, v), errors[field.id], uploadingFiles[field.id], (f) => handleFileUpload(field.id, f))}
          </div>
        ))}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {settings.submitButtonText}
        </Button>
      </form>
    </div>
  )
}

function renderField(
  field: FormField,
  value: any,
  onChange: (v: any) => void,
  error?: string,
  uploading?: boolean,
  onFileUpload?: (file: File) => void
) {
  const baseInputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-colors'
  const errorClass = error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''

  switch (field.type) {
    case 'heading':
      return (
        <div className="pt-4">
          <h2 className="text-xl font-semibold text-gray-900">{field.label}</h2>
          {field.description && <p className="text-sm text-gray-500 mt-1">{field.description}</p>}
        </div>
      )

    case 'paragraph':
      return (
        <p className="text-sm text-gray-600 leading-relaxed">
          {field.description || field.label}
        </p>
      )

    case 'text':
    case 'email':
    case 'phone':
      return (
        <FieldWrapper field={field} error={error}>
          <input
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={`${baseInputClass} ${errorClass}`}
          />
        </FieldWrapper>
      )

    case 'number':
      return (
        <FieldWrapper field={field} error={error}>
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={`${baseInputClass} ${errorClass}`}
          />
        </FieldWrapper>
      )

    case 'textarea':
      return (
        <FieldWrapper field={field} error={error}>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`${baseInputClass} ${errorClass} resize-y`}
          />
        </FieldWrapper>
      )

    case 'date':
      return (
        <FieldWrapper field={field} error={error}>
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClass} ${errorClass}`}
          />
        </FieldWrapper>
      )

    case 'time':
      return (
        <FieldWrapper field={field} error={error}>
          <input
            type="time"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClass} ${errorClass}`}
          />
        </FieldWrapper>
      )

    case 'select':
      return (
        <FieldWrapper field={field} error={error}>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClass} ${errorClass}`}
          >
            <option value="">{field.placeholder || 'Select an option...'}</option>
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </FieldWrapper>
      )

    case 'multiselect':
      return (
        <FieldWrapper field={field} error={error}>
          <div className="space-y-2">
            {(field.options || []).map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(value || []).includes(opt)}
                  onChange={(e) => {
                    const arr = value || []
                    onChange(
                      e.target.checked ? [...arr, opt] : arr.filter((v: string) => v !== opt)
                    )
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        </FieldWrapper>
      )

    case 'checkbox':
      return (
        <FieldWrapper field={field} error={error}>
          <div className="space-y-2">
            {(field.options || []).map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(value || []).includes(opt)}
                  onChange={(e) => {
                    const arr = value || []
                    onChange(
                      e.target.checked ? [...arr, opt] : arr.filter((v: string) => v !== opt)
                    )
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        </FieldWrapper>
      )

    case 'radio':
      return (
        <FieldWrapper field={field} error={error}>
          <div className="space-y-2">
            {(field.options || []).map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  className="border-gray-300"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        </FieldWrapper>
      )

    case 'rating':
      return (
        <FieldWrapper field={field} error={error}>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className="p-0.5"
              >
                <Star
                  size={28}
                  className={n <= (value || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                />
              </button>
            ))}
          </div>
        </FieldWrapper>
      )

    case 'file':
      return (
        <FieldWrapper field={field} error={error}>
          {value ? (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Upload size={16} className="text-gray-400" />
              <span className="text-sm text-gray-700">{value.filename}</span>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="ml-auto text-gray-400 hover:text-red-500"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
              {uploading ? (
                <Loader2 size={20} className="animate-spin mx-auto text-gray-400" />
              ) : (
                <>
                  <Upload size={20} className="mx-auto text-gray-400 mb-2" />
                  <label className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                    Click to upload
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && onFileUpload) onFileUpload(file)
                      }}
                    />
                  </label>
                </>
              )}
            </div>
          )}
        </FieldWrapper>
      )

    default:
      return null
  }
}

function FieldWrapper({
  field,
  error,
  children,
}: {
  field: FormField
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-1.5">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-gray-500 mb-2">{field.description}</p>
      )}
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}
