'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FormField, FieldType, FormSettings, DEFAULT_FORM_SETTINGS } from '@/types'
import { QuestionSidebar } from '@/components/form-builder/QuestionSidebar'
import { QuestionCanvas } from '@/components/form-builder/QuestionCanvas'
import { QuestionSettings } from '@/components/form-builder/QuestionSettings'
import { ShareTab } from '@/components/form-builder/ShareTab'
import { Button } from '@/components/ui/button'
import { Eye, Share2, BarChart3, Link2 } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import Link from 'next/link'

export default function FormEditorPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.formId as string

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<FormField[]>([])
  const [settings, setSettings] = useState<FormSettings>(DEFAULT_FORM_SETTINGS)
  const [status, setStatus] = useState('draft')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'create' | 'logic' | 'connect' | 'share' | 'results'>('create')
  const [loading, setLoading] = useState(true)

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null
  const selectedFieldIndex = fields.findIndex((f) => f.id === selectedFieldId)

  useEffect(() => {
    fetch(`/api/forms/${formId}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title)
        setDescription(data.description || '')
        setFields(data.fields || [])
        setSettings(data.settings || DEFAULT_FORM_SETTINGS)
        setStatus(data.status)
        setSlug(data.slug)
        setLoading(false)
        if (data.fields?.length > 0) {
          setSelectedFieldId(data.fields[0].id)
        }
      })
  }, [formId])

  const saveForm = useCallback(async () => {
    setSaving(true)
    try {
      await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, fields, settings }),
      })
      setLastSaved(new Date())
    } catch (err) {
      console.error('Save failed:', err)
    }
    setSaving(false)
  }, [formId, title, description, fields, settings])

  useEffect(() => {
    if (loading) return
    const timer = setTimeout(saveForm, 3000)
    return () => clearTimeout(timer)
  }, [fields, settings, title, description, loading, saveForm])

  function addField(type: FieldType) {
    const defaultLabels: Record<string, string> = {
      text: 'Question text here',
      email: 'Email address',
      number: 'Number',
      phone: 'Phone number',
      textarea: 'Question text here',
      select: 'Select an option',
      multiselect: 'Select multiple options',
      checkbox: 'Choose all that apply',
      radio: 'Choose one option',
      date: 'Select a date',
      time: 'Select a time',
      file: 'Upload a file',
      rating: 'Rate this',
      heading: 'Welcome Screen',
      paragraph: 'Thank You Screen',
      website: 'Website URL',
    }

    const newField: FormField = {
      id: uuid(),
      type,
      label: defaultLabels[type] || 'Question text here',
      required: false,
      order: fields.length,
      placeholder: getDefaultPlaceholder(type),
      options: ['select', 'multiselect', 'checkbox', 'radio'].includes(type)
        ? ['Option 1', 'Option 2', 'Option 3']
        : undefined,
    }
    let newFields: FormField[]
    if (type === 'heading') {
      // Welcome Screen goes to the start
      newFields = [newField, ...fields]
    } else {
      // Everything else appends at the end (Thank You screens naturally end up last)
      newFields = [...fields, newField]
    }
    setFields(newFields)
    setSelectedFieldId(newField.id)
  }

  function updateField(id: string, updated: FormField) {
    setFields(fields.map((f) => (f.id === id ? updated : f)))
  }

  function deleteField(id: string) {
    const idx = fields.findIndex((f) => f.id === id)
    const newFields = fields.filter((f) => f.id !== id)
    setFields(newFields)
    if (selectedFieldId === id) {
      setSelectedFieldId(newFields[Math.min(idx, newFields.length - 1)]?.id || null)
    }
  }

  function moveField(id: string, direction: 'up' | 'down') {
    const idx = fields.findIndex((f) => f.id === id)
    if (direction === 'up' && idx > 0) {
      const newFields = [...fields]
      ;[newFields[idx], newFields[idx - 1]] = [newFields[idx - 1], newFields[idx]]
      setFields(newFields)
    } else if (direction === 'down' && idx < fields.length - 1) {
      const newFields = [...fields]
      ;[newFields[idx], newFields[idx + 1]] = [newFields[idx + 1], newFields[idx]]
      setFields(newFields)
    }
  }

  function duplicateField(id: string) {
    const field = fields.find((f) => f.id === id)
    if (!field) return
    const newField = { ...field, id: uuid(), label: field.label }
    const idx = fields.findIndex((f) => f.id === id)
    const newFields = [...fields]
    newFields.splice(idx + 1, 0, newField)
    setFields(newFields)
    setSelectedFieldId(newField.id)
  }

  async function togglePublish() {
    await saveForm()
    const res = await fetch(`/api/forms/${formId}/publish`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setStatus(data.status)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-8 w-8 border-2 border-gray-900 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Top Nav */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
            Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm font-medium bg-transparent border border-transparent hover:border-gray-300 focus:border-gray-400 rounded-md px-2 py-1 focus:outline-none min-w-[120px]"
            placeholder="Form title"
          />
          {saving && <span className="text-xs text-gray-400 ml-2">Saving...</span>}
          {!saving && lastSaved && (
            <span className="text-xs text-gray-400 ml-2">Saved</span>
          )}
        </div>

        {/* Center tabs */}
        <div className="flex items-center gap-1">
          {(['create', 'share', 'results'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'results') {
                  router.push(`/forms/${formId}/responses`)
                } else {
                  setActiveTab(tab)
                }
              }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? 'text-gray-900 bg-gray-100'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {status === 'published' && (
            <Link href={`/f/${slug}`} target="_blank">
              <Button variant="ghost" size="sm">
                <Eye size={14} className="mr-1.5" />
                Preview
              </Button>
            </Link>
          )}
          <Button
            size="sm"
            onClick={togglePublish}
            className={status === 'published' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
          >
            {status === 'published' ? 'Published' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Share Tab */}
      {activeTab === 'share' ? (
        <ShareTab formId={formId} slug={slug} status={status} onPublish={togglePublish} />
      ) : (
        /* Create Tab - 3-panel layout */
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - Questions list */}
          <QuestionSidebar
            fields={fields}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onAddField={addField}
            onDeleteField={deleteField}
            onMoveField={moveField}
            onDuplicateField={duplicateField}
            onReorderFields={setFields}
          />

          {/* Center canvas */}
          <QuestionCanvas
            field={selectedField}
            fieldIndex={selectedFieldIndex}
            totalFields={fields.length}
            onUpdate={(updated) => selectedField && updateField(selectedField.id, updated)}
            design={settings.design}
          />

          {/* Right sidebar - Question settings */}
          <QuestionSettings
            field={selectedField}
            settings={settings}
            onUpdateField={(updated) => selectedField && updateField(selectedField.id, updated)}
            onUpdateSettings={setSettings}
          />
        </div>
      )}
    </div>
  )
}

function getDefaultPlaceholder(type: FieldType): string {
  switch (type) {
    case 'text': return 'Type your answer here...'
    case 'email': return 'name@example.com'
    case 'phone': return '+1 (555) 000-0000'
    case 'number': return '0'
    case 'textarea': return 'Type your answer here...'
    case 'website': return 'https://'
    default: return ''
  }
}
