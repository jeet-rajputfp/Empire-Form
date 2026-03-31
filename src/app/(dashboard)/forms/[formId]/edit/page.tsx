'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FormField, FieldType, FormSettings, DEFAULT_FORM_SETTINGS } from '@/types'
import { FieldPalette } from '@/components/form-builder/FieldPalette'
import { FieldEditor } from '@/components/form-builder/FieldEditor'
import { FormSettingsPanel } from '@/components/form-builder/FormSettings'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Eye, Globe, Settings, Layers } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import Link from 'next/link'

export default function FormEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const formId = params.formId as string

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<FormField[]>([])
  const [settings, setSettings] = useState<FormSettings>(DEFAULT_FORM_SETTINGS)
  const [status, setStatus] = useState('draft')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState<'fields' | 'settings'>('fields')
  const [loading, setLoading] = useState(true)

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

  // Auto-save builder state every 5 seconds when there are changes
  useEffect(() => {
    if (loading) return
    const timer = setTimeout(saveForm, 5000)
    return () => clearTimeout(timer)
  }, [fields, settings, title, description, loading, saveForm])

  function addField(type: FieldType) {
    const defaultLabels: Record<string, string> = {
      text: 'Short Text',
      email: 'Email Address',
      number: 'Number',
      phone: 'Phone Number',
      textarea: 'Long Text',
      select: 'Dropdown',
      multiselect: 'Multi Select',
      checkbox: 'Checkboxes',
      radio: 'Radio Buttons',
      date: 'Date',
      time: 'Time',
      file: 'File Upload',
      rating: 'Rating',
      heading: 'Section Heading',
      paragraph: 'Paragraph Text',
    }

    const newField: FormField = {
      id: uuid(),
      type,
      label: defaultLabels[type] || type,
      required: false,
      order: fields.length,
      options: ['select', 'multiselect', 'checkbox', 'radio'].includes(type)
        ? ['Option 1', 'Option 2', 'Option 3']
        : undefined,
    }
    setFields([...fields, newField])
  }

  function updateField(index: number, updated: FormField) {
    const newFields = [...fields]
    newFields[index] = updated
    setFields(newFields)
  }

  function deleteField(index: number) {
    setFields(fields.filter((_, i) => i !== index))
  }

  function moveField(index: number, direction: 'up' | 'down') {
    const newFields = [...fields]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]]
    setFields(newFields)
  }

  async function togglePublish() {
    const res = await fetch(`/api/forms/${formId}/publish`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setStatus(data.status)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-gray-900 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft size={18} />
              </button>
            </Link>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none"
              placeholder="Form title"
            />
          </div>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-gray-400">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={saveForm} loading={saving}>
              <Save size={14} className="mr-1" />
              Save
            </Button>
            {status === 'published' && (
              <Link href={`/f/${slug}`} target="_blank">
                <Button variant="ghost" size="sm">
                  <Eye size={14} className="mr-1" />
                  Preview
                </Button>
              </Link>
            )}
            <Button
              variant={status === 'published' ? 'secondary' : 'primary'}
              size="sm"
              onClick={togglePublish}
            >
              <Globe size={14} className="mr-1" />
              {status === 'published' ? 'Unpublish' : 'Publish'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-72 flex-shrink-0">
            <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('fields')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === 'fields'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Layers size={14} />
                Fields
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings size={14} />
                Settings
              </button>
            </div>
            {activeTab === 'fields' ? (
              <FieldPalette onAddField={addField} />
            ) : (
              <FormSettingsPanel settings={settings} onUpdate={setSettings} />
            )}
          </div>

          {/* Builder Canvas */}
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-600 focus:border-gray-400 focus:outline-none resize-none"
                placeholder="Form description (optional)"
                rows={2}
              />
            </div>

            {fields.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
                <Layers size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">
                  Add fields from the palette to start building your form
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <FieldEditor
                    key={field.id}
                    field={field}
                    onUpdate={(updated) => updateField(index, updated)}
                    onDelete={() => deleteField(index)}
                    onMoveUp={() => moveField(index, 'up')}
                    onMoveDown={() => moveField(index, 'down')}
                    isFirst={index === 0}
                    isLast={index === fields.length - 1}
                  />
                ))}
              </div>
            )}

            {status === 'published' && (
              <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-green-800 font-medium">Form is live!</p>
                <p className="text-xs text-green-600 mt-1">
                  Share URL:{' '}
                  <code className="bg-green-100 px-2 py-0.5 rounded">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/f/{slug}
                  </code>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
