'use client'

import { useState } from 'react'
import { FormSettings } from '@/types'
import { MoreHorizontal, ExternalLink } from 'lucide-react'

interface ConnectTabProps {
  formId: string
  settings: FormSettings
  onUpdateSettings: (settings: FormSettings) => void
  onSave: () => void
}

export function ConnectTab({ formId, settings, onUpdateSettings, onSave }: ConnectTabProps) {
  const [sheetUrl, setSheetUrl] = useState(settings.googleSheetUrl || '')
  const [showSheetConfig, setShowSheetConfig] = useState(false)

  function toggleGoogleSheets() {
    const enabled = !settings.googleSheetEnabled
    onUpdateSettings({ ...settings, googleSheetEnabled: enabled })
    if (!enabled) {
      onUpdateSettings({ ...settings, googleSheetEnabled: false, googleSheetUrl: '' })
      setSheetUrl('')
    }
    setTimeout(onSave, 500)
  }

  function saveSheetUrl() {
    onUpdateSettings({ ...settings, googleSheetUrl: sheetUrl })
    setShowSheetConfig(false)
    setTimeout(onSave, 500)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Connect</h2>
        <p className="text-sm text-gray-500 mb-6">Integrate with external services to sync your form data automatically.</p>

        {/* Google Sheets Integration */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            {/* Google Sheets Icon */}
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="2" width="18" height="20" rx="2" fill="#0F9D58"/>
                <rect x="6" y="6" width="12" height="12" rx="1" fill="white"/>
                <line x1="6" y1="10" x2="18" y2="10" stroke="#0F9D58" strokeWidth="0.5"/>
                <line x1="6" y1="14" x2="18" y2="14" stroke="#0F9D58" strokeWidth="0.5"/>
                <line x1="12" y1="6" x2="12" y2="18" stroke="#0F9D58" strokeWidth="0.5"/>
              </svg>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">Google Sheets</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Send your data straight to Google Sheets. Automatically syncs as results come in.
              </p>
              {settings.googleSheetEnabled && settings.googleSheetUrl && (
                <a
                  href={settings.googleSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-1.5"
                >
                  View Spreadsheet
                  <ExternalLink size={12} />
                </a>
              )}
              {settings.googleSheetEnabled && (
                <div className="mt-2">
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/forms/${formId}/sync-sheet`, { method: 'POST' })
                      if (res.ok) {
                        const data = await res.json()
                        alert(`Ready to sync ${data.totalResponses} responses to Google Sheets.`)
                      } else {
                        alert('Sync failed. Check your sheet configuration.')
                      }
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Sync Responses Now
                  </button>
                </div>
              )}
            </div>

            {/* Toggle + Menu */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={toggleGoogleSheets}
                className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                  settings.googleSheetEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    settings.googleSheetEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <button
                onClick={() => setShowSheetConfig(!showSheetConfig)}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <MoreHorizontal size={16} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Configuration panel */}
          {showSheetConfig && settings.googleSheetEnabled && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Google Sheet URL
                </label>
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Paste the URL of your Google Sheet. New responses will be added as rows automatically.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSheetConfig(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSheetUrl}
                  className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-800"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* More integrations placeholder */}
        <div className="mt-6 text-center py-8">
          <p className="text-sm text-gray-400">More integrations coming soon.</p>
        </div>
      </div>
    </div>
  )
}
