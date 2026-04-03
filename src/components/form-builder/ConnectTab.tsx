'use client'

import { useState } from 'react'
import { FormSettings } from '@/types'
import { MoreHorizontal, ExternalLink, CheckCircle } from 'lucide-react'

interface ConnectTabProps {
  formId: string
  settings: FormSettings
  onUpdateSettings: (settings: FormSettings) => void
  onSave: () => void
}

export function ConnectTab({ formId, settings, onUpdateSettings, onSave }: ConnectTabProps) {
  const [sheetUrl, setSheetUrl] = useState(settings.googleSheetUrl || '')
  const [webhookUrl, setWebhookUrl] = useState((settings as any).googleSheetWebhookUrl || '')
  const [showConfig, setShowConfig] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggleGoogleSheets() {
    const enabled = !settings.googleSheetEnabled
    if (!enabled) {
      onUpdateSettings({ ...settings, googleSheetEnabled: false, googleSheetUrl: '', googleSheetWebhookUrl: '' } as any)
    } else {
      onUpdateSettings({ ...settings, googleSheetEnabled: enabled })
      setShowConfig(true)
    }
    setTimeout(onSave, 500)
  }

  function saveConfig() {
    onUpdateSettings({
      ...settings,
      googleSheetUrl: sheetUrl,
      googleSheetWebhookUrl: webhookUrl,
    } as any)
    setSaved(true)
    setTimeout(() => {
      onSave()
      setSaved(false)
      setShowConfig(false)
    }, 500)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Connect</h2>
        <p className="text-sm text-gray-500 mb-6">Integrate with external services to sync your form data automatically.</p>

        {/* Google Sheets Integration */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="2" width="18" height="20" rx="2" fill="#0F9D58"/>
                <rect x="6" y="6" width="12" height="12" rx="1" fill="white"/>
                <line x1="6" y1="10" x2="18" y2="10" stroke="#0F9D58" strokeWidth="0.5"/>
                <line x1="6" y1="14" x2="18" y2="14" stroke="#0F9D58" strokeWidth="0.5"/>
                <line x1="12" y1="6" x2="12" y2="18" stroke="#0F9D58" strokeWidth="0.5"/>
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">Google Sheets</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Automatically syncs responses to Google Sheets as they come in.
              </p>
              {settings.googleSheetEnabled && settings.googleSheetUrl && (
                <a
                  href={settings.googleSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-1.5"
                >
                  View Spreadsheet <ExternalLink size={12} />
                </a>
              )}
              {settings.googleSheetEnabled && (settings as any).googleSheetWebhookUrl && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-600">
                  <CheckCircle size={12} />
                  Auto-sync enabled
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={toggleGoogleSheets}
                className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                  settings.googleSheetEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  settings.googleSheetEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
              {settings.googleSheetEnabled && (
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <MoreHorizontal size={16} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {showConfig && settings.googleSheetEnabled && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Google Sheet URL</label>
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Apps Script Webhook URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Responses will be automatically sent to this webhook when submitted.
                </p>
              </div>

              {/* Setup instructions */}
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                  How to set up auto-sync (2 min)
                </summary>
                <ol className="mt-2 space-y-1.5 ml-4 list-decimal">
                  <li>Open your Google Sheet</li>
                  <li>Go to <strong>Extensions &gt; Apps Script</strong></li>
                  <li>Delete any code and paste the script below</li>
                  <li>Click <strong>Deploy &gt; New deployment</strong></li>
                  <li>Type: <strong>Web app</strong>, Access: <strong>Anyone</strong></li>
                  <li>Click <strong>Deploy</strong> and copy the URL</li>
                  <li>Paste the URL above</li>
                </ol>
                <div className="mt-2 bg-gray-100 rounded-lg p-3 font-mono text-[11px] leading-relaxed overflow-x-auto">
                  <pre>{`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("Vercel EA Content Questionnaire");
  if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheets()[0];
  var data = JSON.parse(e.postData.contents);
  var headers = sheet.getRange(1,1,1,
    sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) {
    return data[h] || "";
  });
  sheet.appendRow(row);
  return ContentService
    .createTextOutput(JSON.stringify({success:true}))
    .setMimeType(ContentService.MimeType.JSON);
}`}</pre>
                </div>
              </details>

              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowConfig(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">
                  Cancel
                </button>
                <button onClick={saveConfig} className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 flex items-center gap-1.5">
                  {saved ? <><CheckCircle size={14} /> Saved</> : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center py-8">
          <p className="text-sm text-gray-400">More integrations coming soon.</p>
        </div>
      </div>
    </div>
  )
}
