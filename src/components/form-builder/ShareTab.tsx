'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Link2, Plus, Copy, Trash2, Send, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ShareTabProps {
  formId: string
  slug: string
  status: string
  onPublish: () => void
}

export function ShareTab({ formId, slug, status, onPublish }: ShareTabProps) {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewSession, setShowNewSession] = useState(false)
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchSessions()
  }, [formId])

  async function fetchSessions() {
    const res = await fetch(`/api/forms/${formId}/sessions`)
    if (res.ok) setSessions(await res.json())
    setLoading(false)
  }

  async function createSession() {
    if (!clientName) return
    setCreating(true)
    const res = await fetch(`/api/forms/${formId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName, clientEmail }),
    })
    if (res.ok) {
      setShowNewSession(false)
      setClientName('')
      setClientEmail('')
      fetchSessions()
    }
    setCreating(false)
  }

  async function deleteSession(sessionId: string) {
    if (!confirm('Delete this client link?')) return
    await fetch(`/api/forms/${formId}/sessions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
    fetchSessions()
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/s/${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed': return <Badge variant="success">Completed</Badge>
      case 'in_progress': return <Badge variant="warning">In Progress</Badge>
      default: return <Badge variant="default">Not Started</Badge>
    }
  }

  if (status !== 'published') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Send size={40} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Share your form</h2>
          <p className="text-sm text-gray-500 mb-4">Publish your form first to generate client links.</p>
          <Button onClick={onPublish}>Publish Form</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-6">
        {/* Public link */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Public Link</h2>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
            <Link2 size={16} className="text-gray-400 flex-shrink-0" />
            <code className="text-sm text-gray-700 flex-1 truncate">
              {typeof window !== 'undefined' ? window.location.origin : ''}/f/{slug}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/f/${slug}`)
                setCopiedId('public')
                setTimeout(() => setCopiedId(null), 2000)
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex-shrink-0"
            >
              {copiedId === 'public' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Anyone with this link can fill out the form. Responses are anonymous.</p>
        </div>

        {/* Client Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Client Links</h2>
              <p className="text-xs text-gray-500 mt-0.5">Each client gets a unique link with isolated responses and progress tracking.</p>
            </div>
            <Button size="sm" onClick={() => setShowNewSession(true)}>
              <Plus size={14} className="mr-1.5" />
              Add Client
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="grid grid-cols-[1fr,140px,100px,120px,120px,80px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span>Client</span>
              <span>Link</span>
              <span>Status</span>
              <span>Sent</span>
              <span>Completed</span>
              <span></span>
            </div>

            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-gray-900 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400">No client links yet. Click &quot;Add Client&quot; to create one.</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="grid grid-cols-[1fr,140px,100px,120px,120px,80px] gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 items-center text-sm"
                >
                  <div>
                    <span className="font-medium text-gray-900">{session.clientName}</span>
                    {session.clientEmail && (
                      <span className="text-gray-400 text-xs ml-2">{session.clientEmail}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyLink(session.token)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <Copy size={12} />
                      {copiedId === session.token ? 'Copied!' : 'Copy'}
                    </button>
                    <a
                      href={`/s/${session.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <div>{getStatusBadge(session.status)}</div>
                  <span className="text-gray-500 text-xs">{formatDate(session.sentAt)}</span>
                  <span className="text-gray-500 text-xs">
                    {session.completedAt ? formatDate(session.completedAt) : '—'}
                  </span>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      <Modal isOpen={showNewSession} onClose={() => setShowNewSession(false)} title="Add Client">
        <div className="space-y-4">
          <Input
            label="Client Name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g., Acme Corp"
            autoFocus
          />
          <Input
            label="Client Email (optional)"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="contact@acme.com"
          />
          <p className="text-xs text-gray-400">
            A unique link will be generated for this client with isolated response tracking.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowNewSession(false)}>Cancel</Button>
            <Button onClick={createSession} loading={creating} disabled={!clientName}>
              Create Link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
