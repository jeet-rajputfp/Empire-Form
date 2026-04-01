import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getAuthUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return { id: user.id, email: user.email!, name: user.user_metadata?.name }
}
