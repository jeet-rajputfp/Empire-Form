import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function getAuthUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  // Auto-sync: ensure user exists in app DB
  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser) {
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User'
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          name,
          passwordHash: 'supabase-auth',
          role: 'admin',
        },
      })
      // Create default workspace
      await prisma.workspace.create({
        data: {
          name: `${name}'s Workspace`,
          slug: `workspace-${user.id.slice(0, 8)}`,
          members: {
            create: { userId: user.id, role: 'owner' },
          },
        },
      })
    }
  } catch (e) {
    // User likely already exists, continue
  }

  return { id: user.id, email: user.email!, name: user.user_metadata?.name }
}
