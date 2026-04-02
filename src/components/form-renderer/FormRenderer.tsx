'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { FormField, FormSettings } from '@/types'
import { CheckCircle, Loader2, Save, Star, Upload, X, ChevronUp, ChevronDown } from 'lucide-react'

interface FormRendererProps {
  formId: string
  title: string
  description?: string
  fields: FormField[]
  settings: FormSettings
  sessionToken?: string
}

export function FormRenderer({ formId, title, description, fields, settings, sessionToken }: FormRendererProps) {
  const storageKey: string = sessionToken ? `session-${sessionToken}` : `form-${formId}-session`
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [responseId, setResponseId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({})
  const pendingChanges = useRef(false)
  const autoSaveTimer = useRef<NodeJS.Timeout>(null)

  const logo = settings.design?.logo || ''

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setAnswers(data.answers || {})
        setResponseId(data.responseId || null)
      } catch {}
    }
  }, [formId])

  // Save session to localStorage
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify({ answers, responseId }))
    }
  }, [answers, responseId, formId])

  // Auto-save
  const autoSave = useCallback(async () => {
    if (!settings.enableAutoSave || Object.keys(answers).length === 0) return
    setAutoSaveStatus('saving')
    try {
      const res = await fetch('/api/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId, responseId, answers, sessionToken }),
      })
      if (res.ok) {
        const data = await res.json()
        if (!responseId) setResponseId(data.responseId)
        setLastSavedAt(new Date(data.savedAt))
        setAutoSaveStatus('saved')
        pendingChanges.current = false
        localStorage.setItem(storageKey, JSON.stringify({ answers, responseId: data.responseId }))
      } else {
        setAutoSaveStatus('error')
      }
    } catch {
      setAutoSaveStatus('error')
    }
    setTimeout(() => setAutoSaveStatus((s) => (s === 'saved' ? 'idle' : s)), 2000)
  }, [formId, responseId, answers, settings.enableAutoSave])

  useEffect(() => {
    if (!settings.enableAutoSave || submitted) return
    pendingChanges.current = true
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(autoSave, settings.autoSaveInterval || 3000)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [answers, settings.enableAutoSave, settings.autoSaveInterval, autoSave, submitted])

  // beforeunload
  useEffect(() => {
    function handleBeforeUnload() {
      if (pendingChanges.current && Object.keys(answers).length > 0) {
        navigator.sendBeacon('/api/autosave', JSON.stringify({ formId, responseId, answers }))
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [formId, responseId, answers])

  function updateAnswer(fieldId: string, value: any) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
    if (errors[fieldId]) {
      setErrors((prev) => { const next = { ...prev }; delete next[fieldId]; return next })
    }
  }

  function validateCurrentField(): boolean {
    const field = fields[currentStep]
    if (!field || field.type === 'heading' || field.type === 'paragraph') return true
    const value = answers[field.id]
    if (field.required && (value === undefined || value === '' || value === null)) {
      setErrors({ ...errors, [field.id]: 'This field is required' })
      return false
    }
    if (value && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
      setErrors({ ...errors, [field.id]: 'Please enter a valid email' })
      return false
    }
    return true
  }

  function goNext() {
    if (!validateCurrentField()) return
    if (currentStep < fields.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  function goPrev() {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/forms/${formId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, responseId, sessionToken }),
      })
      if (res.ok) {
        setSubmitted(true)
        localStorage.removeItem(storageKey)
      }
    } catch (err) {
      console.error('Submit error:', err)
    }
    setSubmitting(false)
  }

  async function handleFileUpload(fieldId: string, file: File) {
    if (!responseId) {
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

  // Handle Enter key to go next
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' && !e.shiftKey) {
        const field = fields[currentStep]
        if (field?.type !== 'textarea') {
          e.preventDefault()
          goNext()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, answers, errors])

  // Submitted screen
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        {logo && <img src={logo} alt="Logo" className="max-h-14 object-contain mb-12" />}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Response Submitted!</h2>
        <p className="text-gray-500 max-w-md text-center">{settings.successMessage}</p>
      </div>
    )
  }

  const field = fields[currentStep]
  const isWelcome = field?.type === 'heading'
  const isThankYou = field?.type === 'paragraph'
  const isLayout = isWelcome || isThankYou
  const isLastStep = currentStep === fields.length - 1

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Logo */}
      {logo && (
        <div className="flex justify-center pt-8">
          <img src={logo} alt="Logo" className="max-h-14 object-contain" />
        </div>
      )}

      {/* Main content - centered vertically */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-2xl">
          {field && isLayout ? (
            /* Welcome / Thank You screen */
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{field.label}</h1>
              {field.description && (
                <p className="text-lg text-gray-600 leading-relaxed mb-8">{field.description}</p>
              )}
              {isWelcome && (
                <div>
                  <button
                    onClick={goNext}
                    className="bg-purple-700 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors"
                  >
                    Let&apos;s get started!
                  </button>
                  <p className="mt-3 text-sm text-gray-400">
                    press <span className="font-medium text-gray-500">Enter</span> ↵
                  </p>
                </div>
              )}
            </div>
          ) : field ? (
            /* Question */
            <div>
              <label className="block text-xl font-medium text-gray-900 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              {field.description && (
                <p className="text-sm text-gray-500 mb-6">{field.description}</p>
              )}
              {!field.description && <div className="mb-6" />}

              <div className="mb-6">
                {renderField(field, answers[field.id], (v) => updateAnswer(field.id, v), errors[field.id], uploadingFiles[field.id], (f) => handleFileUpload(field.id, f))}
              </div>

              <button
                onClick={goNext}
                disabled={submitting}
                className="bg-purple-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : isLastStep ? settings.submitButtonText : 'OK'}
              </button>
              <span className="ml-3 text-sm text-gray-400">
                press <span className="font-medium text-gray-500">Enter</span> ↵
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Auto-save indicator */}
      {settings.enableAutoSave && autoSaveStatus !== 'idle' && (
        <div className="fixed bottom-20 left-6 text-xs text-gray-400 flex items-center gap-1.5">
          {autoSaveStatus === 'saving' && <><Loader2 size={12} className="animate-spin" /> Saving...</>}
          {autoSaveStatus === 'saved' && <><Save size={12} className="text-green-500" /> Saved</>}
          {autoSaveStatus === 'error' && <><X size={12} className="text-red-500" /> Save failed</>}
        </div>
      )}

      {/* Navigation arrows - bottom right */}
      <div className="fixed bottom-6 right-6 flex items-center gap-1">
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-purple-700 text-white hover:bg-purple-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronUp size={18} />
        </button>
        <button
          onClick={goNext}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-purple-700 text-white hover:bg-purple-800 transition-colors"
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {/* Powered by */}
      <div className="text-center py-4 text-xs text-gray-300">
        Powered by Empire Form
      </div>
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
  const inputBase = 'w-full text-lg border-0 border-b-2 border-gray-200 focus:border-purple-600 outline-none pb-2 bg-transparent transition-colors placeholder:text-gray-300'

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'number':
    case 'website':
      return (
        <div>
          <input
            type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'Type your answer here...'}
            className={inputBase}
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      )

    case 'textarea':
      return (
        <div>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'Type your answer here...'}
            rows={4}
            className={`${inputBase} resize-none`}
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      )

    case 'date':
      return (
        <div>
          <input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} className={inputBase} autoFocus />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      )

    case 'time':
      return (
        <div>
          <input type="time" value={value || ''} onChange={(e) => onChange(e.target.value)} className={inputBase} autoFocus />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      )

    case 'select':
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt, i) => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all ${
                value === opt
                  ? 'border-purple-600 bg-purple-50 text-purple-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <span className={`w-7 h-7 rounded border-2 flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                value === opt ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300 text-gray-400'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm">{opt}</span>
            </button>
          ))}
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      )

    case 'radio':
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt, i) => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all ${
                value === opt
                  ? 'border-purple-600 bg-purple-50 text-purple-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                value === opt ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300 text-gray-400'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm">{opt}</span>
            </button>
          ))}
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      )

    case 'checkbox':
    case 'multiselect':
      return (
        <div className="space-y-2">
          {(field.options || []).map((opt, i) => {
            const selected = (value || []).includes(opt)
            return (
              <button
                key={opt}
                onClick={() => {
                  const arr = value || []
                  onChange(selected ? arr.filter((v: string) => v !== opt) : [...arr, opt])
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all ${
                  selected
                    ? 'border-purple-600 bg-purple-50 text-purple-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <span className={`w-7 h-7 rounded border-2 flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                  selected ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300 text-gray-400'
                }`}>
                  {selected ? '✓' : String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm">{opt}</span>
              </button>
            )
          })}
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      )

    case 'rating':
      return (
        <div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => onChange(n)} className="p-1">
                <Star size={36} className={n <= (value || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
              </button>
            ))}
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      )

    case 'file':
      return (
        <div>
          {value ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
              <Upload size={16} className="text-gray-400" />
              <span className="text-sm text-gray-700 flex-1">{value.filename}</span>
              <button onClick={() => onChange(null)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
            </div>
          ) : (
            <label className="block border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-gray-300 transition-colors">
              {uploading ? (
                <Loader2 size={24} className="animate-spin mx-auto text-gray-400" />
              ) : (
                <>
                  <Upload size={24} className="mx-auto text-gray-300 mb-2" />
                  <span className="text-sm text-gray-500">Click to upload a file</span>
                </>
              )}
              <input type="file" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0]
                if (file && onFileUpload) onFileUpload(file)
              }} />
            </label>
          )}
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      )

    default:
      return (
        <div>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || 'Type your answer here...'}
            className={inputBase}
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      )
  }
}
