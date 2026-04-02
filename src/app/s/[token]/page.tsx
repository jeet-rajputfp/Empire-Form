'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { FormRenderer } from '@/components/form-renderer/FormRenderer'
import { FileText } from 'lucide-react'

export default function SessionFormPage() {
  const params = useParams()
  const token = params.token as string
  const [form, setForm] = useState<any>(null)
  const [sessionData, setSessionData] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/sessions/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error('Session not found')
        return r.json()
      })
      .then((data) => {
        setForm(data.form)
        setSessionData(data.session)
      })
      .catch(() => setError('This form link is no longer available.'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-8 w-8 border-2 border-gray-900 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Link Not Found</h1>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <FormRenderer
        formId={form.id}
        title={form.title}
        description={form.description}
        fields={form.fields}
        settings={form.settings}
        sessionToken={token}
      />
    </div>
  )
}
