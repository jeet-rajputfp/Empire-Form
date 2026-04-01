'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Dropdown } from '@/components/ui/dropdown'
import {
  FileText, Plus, Search, FolderOpen, BarChart3,
  ExternalLink, Copy, Pencil, Trash2, LogOut, Eye
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [forms, setForms] = useState<any[]>([])
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [showNewWorkspace, setShowNewWorkspace] = useState(false)
  const [newFormTitle, setNewFormTitle] = useState('')
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/signin')
        return
      }
      setUser(user)
      // Ensure user profile is synced to app DB
      await fetch('/api/auth/sync', { method: 'POST' })
      setLoading(false)
      fetchWorkspaces()
      fetchForms()
    })
  }, [])

  async function fetchWorkspaces() {
    const res = await fetch('/api/workspaces')
    if (res.ok) {
      const data = await res.json()
      setWorkspaces(data)
      if (data.length > 0 && !activeWorkspace) {
        setActiveWorkspace(data[0].id)
      }
    }
  }

  async function fetchForms() {
    const url = activeWorkspace
      ? `/api/forms?workspaceId=${activeWorkspace}`
      : '/api/forms'
    const res = await fetch(url)
    if (res.ok) setForms(await res.json())
  }

  useEffect(() => {
    if (!loading) fetchForms()
  }, [activeWorkspace])

  async function createForm() {
    if (!newFormTitle || !activeWorkspace) return
    setCreating(true)
    const res = await fetch('/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newFormTitle, workspaceId: activeWorkspace }),
    })
    if (res.ok) {
      const form = await res.json()
      setShowNewForm(false)
      setNewFormTitle('')
      router.push(`/forms/${form.id}/edit`)
    } else {
      const err = await res.json().catch(() => ({}))
      alert(err.error || 'Failed to create form. Please try again.')
    }
    setCreating(false)
  }

  async function createWorkspace() {
    if (!newWorkspaceName) return
    setCreating(true)
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newWorkspaceName }),
    })
    if (res.ok) {
      setShowNewWorkspace(false)
      setNewWorkspaceName('')
      fetchWorkspaces()
    }
    setCreating(false)
  }

  async function deleteForm(formId: string) {
    if (!confirm('Delete this form and all its responses?')) return
    await fetch(`/api/forms/${formId}`, { method: 'DELETE' })
    fetchForms()
  }

  async function duplicateForm(form: any) {
    const res = await fetch('/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `${form.title} (Copy)`, workspaceId: form.workspaceId }),
    })
    if (res.ok) {
      const newForm = await res.json()
      await fetch(`/api/forms/${newForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: JSON.parse(form.fields),
          settings: JSON.parse(form.settings),
        }),
      })
      fetchForms()
    }
  }

  function copyShareUrl(slug: string) {
    const url = `${window.location.origin}/f/${slug}`
    navigator.clipboard.writeText(url)
  }

  async function handleSignOut() {
    await fetch('/api/auth/signout', { method: 'POST' })
    await supabase.auth.signOut()
    router.push('/auth/signin')
    router.refresh()
  }

  const filteredForms = forms.filter((f) =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeWorkspaceData = workspaces.find((w) => w.id === activeWorkspace)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-gray-900 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <FileText size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">EMPIRE FORM</span>
          </div>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Find workspace or form"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="px-3 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen size={12} />
              Workspaces
            </span>
            <button
              onClick={() => setShowNewWorkspace(true)}
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => setActiveWorkspace(ws.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                activeWorkspace === ws.id
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="truncate">{ws.name}</span>
              <span className="text-xs text-gray-400">{ws._count?.forms || 0}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
              {user?.user_metadata?.name?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {user?.user_metadata?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button onClick={handleSignOut} className="text-gray-400 hover:text-gray-600">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {activeWorkspaceData?.name || 'All Forms'}
              </h1>
            </div>
            <Button onClick={() => setShowNewForm(true)}>
              <Plus size={16} className="mr-1.5" />
              Create Form
            </Button>
          </div>

          {/* Forms table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-[1fr,120px,100px,130px,130px,40px] gap-4 px-5 py-3 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span>Forms</span>
              <span>Status</span>
              <span>Responses</span>
              <span>Last Updated</span>
              <span>Date Created</span>
              <span></span>
            </div>

            {filteredForms.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No forms yet. Create your first form!</p>
              </div>
            ) : (
              filteredForms.map((form) => (
                <div
                  key={form.id}
                  className="grid grid-cols-[1fr,120px,100px,130px,130px,40px] gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors items-center"
                >
                  <Link
                    href={`/forms/${form.id}/edit`}
                    className="text-sm font-medium text-gray-900 hover:text-gray-700 truncate"
                  >
                    {form.title}
                  </Link>
                  <div>
                    <Badge
                      variant={
                        form.status === 'published'
                          ? 'success'
                          : form.status === 'closed'
                          ? 'danger'
                          : 'default'
                      }
                    >
                      {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                      {form.status === 'published' && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 ml-1.5" />
                      )}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-600">{form._count?.responses || 0}</span>
                  <span className="text-sm text-gray-500">{formatDate(form.updatedAt)}</span>
                  <span className="text-sm text-gray-500">{formatDate(form.createdAt)}</span>
                  <Dropdown
                    items={[
                      {
                        label: 'Edit',
                        icon: <Pencil size={14} />,
                        onClick: () => router.push(`/forms/${form.id}/edit`),
                      },
                      {
                        label: 'View Responses',
                        icon: <BarChart3 size={14} />,
                        onClick: () => router.push(`/forms/${form.id}/responses`),
                      },
                      ...(form.status === 'published'
                        ? [
                            {
                              label: 'Open Form',
                              icon: <ExternalLink size={14} />,
                              onClick: () => window.open(`/f/${form.slug}`, '_blank'),
                            },
                            {
                              label: 'Copy Link',
                              icon: <Copy size={14} />,
                              onClick: () => copyShareUrl(form.slug),
                            },
                          ]
                        : []),
                      {
                        label: 'Duplicate',
                        icon: <Copy size={14} />,
                        onClick: () => duplicateForm(form),
                      },
                      {
                        label: 'Delete',
                        icon: <Trash2 size={14} />,
                        onClick: () => deleteForm(form.id),
                        variant: 'danger' as const,
                      },
                    ]}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* New Form Modal */}
      <Modal isOpen={showNewForm} onClose={() => setShowNewForm(false)} title="Create New Form">
        <div className="space-y-4">
          <Input
            label="Form Title"
            value={newFormTitle}
            onChange={(e) => setNewFormTitle(e.target.value)}
            placeholder="e.g., Customer Feedback Survey"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowNewForm(false)}>
              Cancel
            </Button>
            <Button onClick={createForm} loading={creating} disabled={!newFormTitle}>
              Create Form
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Workspace Modal */}
      <Modal
        isOpen={showNewWorkspace}
        onClose={() => setShowNewWorkspace(false)}
        title="Create Workspace"
      >
        <div className="space-y-4">
          <Input
            label="Workspace Name"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            placeholder="e.g., Marketing Team"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowNewWorkspace(false)}>
              Cancel
            </Button>
            <Button onClick={createWorkspace} loading={creating} disabled={!newWorkspaceName}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
