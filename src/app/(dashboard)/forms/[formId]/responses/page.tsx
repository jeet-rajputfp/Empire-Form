'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Download, BarChart3, Users, CheckCircle,
  Clock, TrendingUp, ChevronDown, ChevronUp, FileText
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function ResponsesPage() {
  const params = useParams()
  const formId = params.formId as string

  const [form, setForm] = useState<any>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/forms/${formId}`).then((r) => r.json()),
      fetch(`/api/forms/${formId}/responses`).then((r) => r.json()),
      fetch(`/api/forms/${formId}/analytics`).then((r) => r.json()),
    ]).then(([formData, responsesData, analyticsData]) => {
      setForm(formData)
      setResponses(responsesData)
      setAnalytics(analyticsData)
      setLoading(false)
    })
  }, [formId])

  function exportCSV() {
    if (!form || !responses.length) return

    const fields = form.fields.filter(
      (f: any) => f.type !== 'heading' && f.type !== 'paragraph'
    )

    const headers = ['Submitted At', ...fields.map((f: any) => f.label)]
    const rows = responses
      .filter((r) => r.status === 'completed')
      .map((r) => {
        return [
          r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '',
          ...fields.map((f: any) => {
            const val = r.answers[f.id]
            if (Array.isArray(val)) return val.join('; ')
            if (typeof val === 'object' && val) return val.filename || JSON.stringify(val)
            return val || ''
          }),
        ]
      })

    const csv = [headers, ...rows]
      .map((row) => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.title}-responses.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-gray-900 border-t-transparent rounded-full" />
      </div>
    )
  }

  const fields = form?.fields?.filter(
    (f: any) => f.type !== 'heading' && f.type !== 'paragraph'
  ) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft size={18} />
                </button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{form?.title}</h1>
                <p className="text-sm text-gray-500">Responses & Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/forms/${formId}/edit`}>
                <Button variant="outline" size="sm">
                  Edit Form
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download size={14} className="mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Users size={16} />
                Total Responses
              </div>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalResponses}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <CheckCircle size={16} />
                Completed
              </div>
              <p className="text-2xl font-bold text-green-600">{analytics.completedResponses}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Clock size={16} />
                In Progress
              </div>
              <p className="text-2xl font-bold text-yellow-600">{analytics.inProgressResponses}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <TrendingUp size={16} />
                Completion Rate
              </div>
              <p className="text-2xl font-bold text-gray-900">{analytics.completionRate}%</p>
            </div>
          </div>
        )}

        {/* Responses Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              All Responses ({responses.length})
            </h2>
          </div>

          {responses.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <FileText size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No responses yet.</p>
            </div>
          ) : (
            <div>
              {responses.map((response, idx) => (
                <div key={response.id} className="border-b border-gray-50">
                  <button
                    onClick={() =>
                      setExpandedResponse(expandedResponse === response.id ? null : response.id)
                    }
                    className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400">#{responses.length - idx}</span>
                      <Badge
                        variant={response.status === 'completed' ? 'success' : 'warning'}
                      >
                        {response.status === 'completed' ? 'Completed' : 'In Progress'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {response.submittedAt
                          ? formatDate(response.submittedAt)
                          : formatDate(response.createdAt)}
                      </span>
                    </div>
                    {expandedResponse === response.id ? (
                      <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </button>

                  {expandedResponse === response.id && (
                    <div className="px-5 pb-4 bg-gray-50">
                      <div className="grid grid-cols-1 gap-3 pt-2">
                        {fields.map((field: any) => {
                          const answer = response.answers[field.id]
                          const displayValue = Array.isArray(answer)
                            ? answer.join(', ')
                            : typeof answer === 'object' && answer
                            ? answer.filename || JSON.stringify(answer)
                            : answer || '—'

                          return (
                            <div key={field.id} className="flex gap-4">
                              <span className="text-sm font-medium text-gray-600 w-48 flex-shrink-0">
                                {field.label}
                              </span>
                              <span className="text-sm text-gray-900">{displayValue}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
