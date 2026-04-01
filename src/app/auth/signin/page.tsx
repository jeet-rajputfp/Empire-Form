'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { name: form.name },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      // After sign up, ensure user profile exists
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name }),
        })
      }

      router.push('/dashboard')
      router.refresh()
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      // Ensure user profile exists
      await fetch('/api/auth/sync', { method: 'POST' })

      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <FileText size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Empire Form</span>
          </Link>
          <p className="mt-3 text-gray-600">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <Input
                label="Name"
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                required
              />
            )}
            <Input
              label="Email"
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
              helperText={isSignUp ? 'Minimum 6 characters' : undefined}
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <Button type="submit" className="w-full" loading={loading}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError('') }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
