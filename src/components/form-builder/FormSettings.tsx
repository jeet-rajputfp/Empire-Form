'use client'

import { FormSettings as FormSettingsType } from '@/types'
import { Input } from '@/components/ui/input'

interface FormSettingsProps {
  settings: FormSettingsType
  onUpdate: (settings: FormSettingsType) => void
}

export function FormSettingsPanel({ settings, onUpdate }: FormSettingsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Form Settings</h3>

      <div className="space-y-4">
        <Input
          label="Submit Button Text"
          value={settings.submitButtonText}
          onChange={(e) => onUpdate({ ...settings, submitButtonText: e.target.value })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Success Message
          </label>
          <textarea
            value={settings.successMessage}
            onChange={(e) => onUpdate({ ...settings, successMessage: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            rows={2}
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showProgressBar}
              onChange={(e) => onUpdate({ ...settings, showProgressBar: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Show progress bar</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableAutoSave}
              onChange={(e) => onUpdate({ ...settings, enableAutoSave: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Enable auto-save</span>
          </label>

          {settings.enableAutoSave && (
            <div className="ml-6">
              <label className="text-xs text-gray-500">Auto-save interval (seconds)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={settings.autoSaveInterval / 1000}
                onChange={(e) =>
                  onUpdate({ ...settings, autoSaveInterval: parseInt(e.target.value) * 1000 || 3000 })
                }
                className="w-20 ml-2 rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allowMultipleSubmissions}
              onChange={(e) => onUpdate({ ...settings, allowMultipleSubmissions: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Allow multiple submissions</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.googleDocSync}
              onChange={(e) => onUpdate({ ...settings, googleDocSync: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Sync to Google Docs</span>
          </label>
          {settings.googleDocSync && (
            <p className="ml-6 text-xs text-gray-500">
              Requires Google OAuth configuration in environment variables.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => onUpdate({ ...settings, theme: e.target.value as any })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          >
            <option value="default">Default</option>
            <option value="minimal">Minimal</option>
            <option value="modern">Modern</option>
          </select>
        </div>
      </div>
    </div>
  )
}
