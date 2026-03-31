'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { FormRenderer } from '@/components/form-renderer/FormRenderer'
import { FileText } from 'lucide-react'

export default function PublicFormPage() {
  const params = useParams()
  const slug = params.slug as string
  const [form, setForm] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/forms/by-slug/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('Form not found')
        return r.json()
      })
      .then(setForm)
      .catch(() => setError('This form is no longer available.'))
      .finally(() => setLoading(false))
  }, [slug])

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
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Form Not Found</h1>
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
      />
      <div className="text-center py-8 text-xs text-gray-400">
        Powered by Empire Form
      </div>
    </div>
  )
}
