'use client'

import { useState } from 'react'
import { FormField, FormSettings, FieldType } from '@/types'
import {
  Type, AlignLeft, Calendar, Hash, CheckSquare,
  ChevronDown, Upload, Mail, Phone, Star,
  ArrowRightFromLine, ArrowLeftFromLine
} from 'lucide-react'

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'text', label: 'Short Text', icon: <Type size={14} />, color: 'bg-emerald-500' },
  { type: 'textarea', label: 'Long Text', icon: <AlignLeft size={14} />, color: 'bg-emerald-500' },
  { type: 'date', label: 'Date And Time', icon: <Calendar size={14} />, color: 'bg-blue-500' },
  { type: 'number', label: 'Number', icon: <Hash size={14} />, color: 'bg-blue-500' },
  { type: 'radio', label: 'Multiple Choice', icon: <CheckSquare size={14} />, color: 'bg-rose-500' },
  { type: 'select', label: 'Dropdown', icon: <ChevronDown size={14} />, color: 'bg-rose-500' },
  { type: 'checkbox', label: 'Checkboxes', icon: <CheckSquare size={14} />, color: 'bg-rose-500' },
  { type: 'rating', label: 'Rating', icon: <Star size={14} />, color: 'bg-amber-500' },
  { type: 'email', label: 'Email', icon: <Mail size={14} />, color: 'bg-teal-500' },
  { type: 'phone', label: 'Phone Number', icon: <Phone size={14} />, color: 'bg-teal-500' },
  { type: 'file', label: 'File Upload', icon: <Upload size={14} />, color: 'bg-green-600' },
]

interface QuestionSettingsProps {
  field: FormField | null
  settings: FormSettings
  onUpdateField: (field: FormField) => void
  onUpdateSettings: (settings: FormSettings) => void
}

export function QuestionSettings({ field, settings, onUpdateField, onUpdateSettings }: QuestionSettingsProps) {
  const [activePanel, setActivePanel] = useState<'question' | 'design' | 'settings'>('question')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)

  if (!field) {
    return (
      <div className="w-72 border-l border-gray-200 flex-shrink-0 bg-white flex items-center justify-center">
        <p className="text-sm text-gray-400">Select a question</p>
      </div>
    )
  }

  const isLayout = field.type === 'heading' || field.type === 'paragraph'
  const currentType = FIELD_TYPES.find((t) => t.type === field.type) || FIELD_TYPES[0]

  return (
    <div className="w-72 border-l border-gray-200 flex-shrink-0 bg-white flex flex-col">
      {/* Panel tabs */}
      <div className="flex border-b border-gray-200">
        {(['question', 'design', 'settings'] as const).map((panel) => (
          <button
            key={panel}
            onClick={() => setActivePanel(panel)}
            className={`flex-1 py-3 text-xs font-medium transition-colors border-b-2 ${
              activePanel === panel
                ? 'text-gray-900 border-gray-900'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            {panel.charAt(0).toUpperCase() + panel.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activePanel === 'question' && !isLayout && (
          <div className="p-4 space-y-5">
            {/* Type selector */}
            <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">Type</label>
              <div className="relative">
                <button
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <span className={`w-7 h-7 ${currentType.color} rounded-lg flex items-center justify-center text-white`}>
                    {currentType.icon}
                  </span>
                  <span className="text-sm text-gray-700 flex-1 text-left">{currentType.label}</span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>

                {showTypeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 max-h-64 overflow-y-auto">
                    {FIELD_TYPES.map((ft) => (
                      <button
                        key={ft.type}
                        onClick={() => {
                          onUpdateField({ ...field, type: ft.type })
                          setShowTypeDropdown(false)
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors ${
                          ft.type === field.type ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span className={`w-6 h-6 ${ft.color} rounded-lg flex items-center justify-center text-white`}>
                          {ft.icon}
                        </span>
                        <span className="text-sm text-gray-700">{ft.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Required toggle */}
            <ToggleRow
              label="Required"
              checked={field.required}
              onChange={(v) => onUpdateField({ ...field, required: v })}
            />

            {/* Min characters */}
            {(field.type === 'text' || field.type === 'textarea') && (
              <>
                <ToggleWithInput
                  label="Min characters"
                  enabled={!!field.validation?.minLength}
                  value={field.validation?.minLength || 0}
                  onToggle={(on) =>
                    onUpdateField({
                      ...field,
                      validation: { ...field.validation, minLength: on ? 1 : undefined },
                    })
                  }
                  onChange={(v) =>
                    onUpdateField({
                      ...field,
                      validation: { ...field.validation, minLength: v },
                    })
                  }
                />
                <ToggleWithInput
                  label="Max characters"
                  enabled={!!field.validation?.maxLength}
                  value={field.validation?.maxLength || 100}
                  onToggle={(on) =>
                    onUpdateField({
                      ...field,
                      validation: { ...field.validation, maxLength: on ? 100 : undefined },
                    })
                  }
                  onChange={(v) =>
                    onUpdateField({
                      ...field,
                      validation: { ...field.validation, maxLength: v },
                    })
                  }
                />
              </>
            )}

            {/* Placeholder text */}
            <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">Placeholder text</label>
              <div className="relative">
                <input
                  type="text"
                  value={field.placeholder || ''}
                  onChange={(e) => onUpdateField({ ...field, placeholder: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                  placeholder="Type your answer here..."
                  maxLength={70}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {(field.placeholder || '').length}/70
                </span>
              </div>
            </div>

            {/* Default answer */}
            <ToggleRow
              label="Default answer (?)"
              checked={false}
              onChange={() => {}}
            />

            {/* Image or video */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-900">Image or video</span>
              <button className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors">
                Add
              </button>
            </div>
          </div>
        )}

        {activePanel === 'question' && isLayout && (
          <div className="p-4">
            <p className="text-sm text-gray-500">
              {field.type === 'heading' ? 'Welcome screen' : 'Thank you screen'} settings.
              Edit the content directly in the preview.
            </p>
          </div>
        )}

        {activePanel === 'design' && (
          <div className="p-4 space-y-4">
            <p className="text-sm text-gray-500">Theme and design options.</p>
            <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => onUpdateSettings({ ...settings, theme: e.target.value as any })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              >
                <option value="default">Default</option>
                <option value="minimal">Minimal</option>
                <option value="modern">Modern</option>
              </select>
            </div>
          </div>
        )}

        {activePanel === 'settings' && (
          <div className="p-4 space-y-4">
            <ToggleRow
              label="Show progress bar"
              checked={settings.showProgressBar}
              onChange={(v) => onUpdateSettings({ ...settings, showProgressBar: v })}
            />
            <ToggleRow
              label="Enable auto-save"
              checked={settings.enableAutoSave}
              onChange={(v) => onUpdateSettings({ ...settings, enableAutoSave: v })}
            />
            <ToggleRow
              label="Allow multiple submissions"
              checked={settings.allowMultipleSubmissions}
              onChange={(v) => onUpdateSettings({ ...settings, allowMultipleSubmissions: v })}
            />
            <ToggleRow
              label="Google Docs sync"
              checked={settings.googleDocSync}
              onChange={(v) => onUpdateSettings({ ...settings, googleDocSync: v })}
            />
            <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">Submit button text</label>
              <input
                type="text"
                value={settings.submitButtonText}
                onChange={(e) => onUpdateSettings({ ...settings, submitButtonText: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">Success message</label>
              <textarea
                value={settings.successMessage}
                onChange={(e) => onUpdateSettings({ ...settings, successMessage: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gray-400 focus:outline-none resize-none"
                rows={3}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-900">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${
          checked ? 'bg-blue-500' : 'bg-gray-200'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

function ToggleWithInput({
  label,
  enabled,
  value,
  onToggle,
  onChange,
}: {
  label: string
  enabled: boolean
  value: number
  onToggle: (on: boolean) => void
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-900">{label}</span>
        <button
          onClick={() => onToggle(!enabled)}
          className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${
            enabled ? 'bg-blue-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      {enabled && (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
        />
      )}
    </div>
  )
}
