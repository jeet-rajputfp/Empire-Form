import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let body: { name?: string } = {}
    try {
      body = await req.json()
    } catch {}

    const name = body.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'

    // Upsert user profile
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email! },
      create: {
        id: user.id,
        email: user.email!,
        name,
        passwordHash: 'supabase-auth',
        role: 'admin',
      },
    })

    // Ensure they have at least one workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
    })

    if (!membership) {
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

    return NextResponse.json({ id: dbUser.id, email: dbUser.email })
  } catch (error) {
    console.error('Auth sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
