'use client'

import { useState } from 'react'
import { FormField, FormSettings, FormDesign, DEFAULT_FORM_DESIGN, FieldType } from '@/types'
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
          <DesignPanel
            design={settings.design || DEFAULT_FORM_DESIGN}
            onUpdate={(design) => onUpdateSettings({ ...settings, design })}
          />
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

function DesignPanel({ design, onUpdate }: { design: FormDesign; onUpdate: (d: FormDesign) => void }) {
  const fonts = ['Roboto', 'Inter', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Playfair Display', 'Source Sans Pro']

  return (
    <div className="p-4 space-y-5">
      {/* Font selector */}
      <div>
        <select
          value={design.font}
          onChange={(e) => onUpdate({ ...design, font: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none"
        >
          {fonts.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Color rows */}
      <ColorRow label="Questions" value={design.questionsColor} onChange={(v) => onUpdate({ ...design, questionsColor: v })} />
      <ColorRow label="Answers" value={design.answersColor} onChange={(v) => onUpdate({ ...design, answersColor: v })} />
      <ColorRow label="Buttons" value={design.buttonsColor} onChange={(v) => onUpdate({ ...design, buttonsColor: v })} />
      <ColorRow label="Button text" value={design.buttonTextColor} onChange={(v) => onUpdate({ ...design, buttonTextColor: v })} />
      <ColorRow label="Background" value={design.backgroundColor} onChange={(v) => onUpdate({ ...design, backgroundColor: v })} />

      {/* Background image */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">Background image</span>
        <button className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-md transition-colors">
          Add
        </button>
      </div>

      {/* Logo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Logo</span>
          {design.logo && (
            <span className="w-5 h-5 bg-gray-200 rounded-full" />
          )}
        </div>
        <button className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-md transition-colors">
          Add
        </button>
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-4">
        {/* Welcome/Thank you font size */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Welcome/Thankyou Font size</span>
          <select
            value={design.welcomeFontSize}
            onChange={(e) => onUpdate({ ...design, welcomeFontSize: parseInt(e.target.value) })}
            className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-gray-400 focus:outline-none text-center"
          >
            {[18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 48].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Questions font size */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Questions Font size</span>
          <select
            value={design.questionsFontSize}
            onChange={(e) => onUpdate({ ...design, questionsFontSize: parseInt(e.target.value) })}
            className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-gray-400 focus:outline-none text-center"
          >
            {[14, 16, 18, 20, 22, 24, 26, 28, 30, 32].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Alignment */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Alignment</span>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => onUpdate({ ...design, alignment: 'left' })}
              className={`px-3 py-1.5 text-sm transition-colors ${
                design.alignment === 'left' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="3" width="12" height="1.5" rx="0.5"/><rect x="2" y="7" width="8" height="1.5" rx="0.5"/><rect x="2" y="11" width="10" height="1.5" rx="0.5"/></svg>
            </button>
            <button
              onClick={() => onUpdate({ ...design, alignment: 'center' })}
              className={`px-3 py-1.5 text-sm border-l border-gray-200 transition-colors ${
                design.alignment === 'center' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="3" width="12" height="1.5" rx="0.5"/><rect x="4" y="7" width="8" height="1.5" rx="0.5"/><rect x="3" y="11" width="10" height="1.5" rx="0.5"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="relative">
        <label className="flex items-center gap-1.5 cursor-pointer border border-gray-200 rounded-lg px-2 py-1.5 hover:border-gray-300 transition-colors">
          <span
            className="w-6 h-6 rounded border border-gray-200"
            style={{ backgroundColor: value }}
          />
          <ChevronDown size={12} className="text-gray-400" />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
      </div>
    </div>
  )
}
