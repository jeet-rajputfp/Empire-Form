'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { FileText, Zap, Shield, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push('/dashboard')
    })
  }, [router])

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Empire Form</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signin">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
            Build forms that never lose data
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Create beautiful forms with real-time auto-save, Google Docs integration,
            and powerful analytics. Every response is captured reliably.
          </p>
          <Link href="/auth/signin">
            <Button size="lg" className="text-base px-8">
              Start Building Forms
            </Button>
          </Link>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-gray-200">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Zap size={20} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-Time Auto-Save</h3>
              <p className="text-sm text-gray-600">
                Every keystroke is saved automatically. No data loss, even if the browser crashes.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                <Shield size={20} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Google Docs Sync</h3>
              <p className="text-sm text-gray-600">
                Responses automatically sync to Google Docs. Files stored in Drive.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 size={20} className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
              <p className="text-sm text-gray-600">
                Track submissions, view responses, and export data from your dashboard.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
