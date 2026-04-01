import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json({ step: 'auth', error: authError.message })
    }

    if (!user) {
      return NextResponse.json({ step: 'auth', error: 'No user in session' })
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      include: { workspace: true },
    })

    return NextResponse.json({
      authUser: { id: user.id, email: user.email },
      dbUser: dbUser ? { id: dbUser.id, email: dbUser.email } : null,
      membership: membership
        ? { workspaceId: membership.workspaceId, workspaceName: membership.workspace.name }
        : null,
    })
  } catch (error: any) {
    return NextResponse.json({ step: 'exception', error: error.message })
  }
}
