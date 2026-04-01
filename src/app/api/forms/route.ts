import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'
import { DEFAULT_FORM_SETTINGS } from '@/types'

export async function GET(req: Request) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const workspaceId = searchParams.get('workspaceId')

  const forms = await prisma.form.findMany({
    where: {
      workspace: {
        members: { some: { userId: user.id } },
      },
      ...(workspaceId ? { workspaceId } : {}),
    },
    include: {
      _count: { select: { responses: true } },
      workspace: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(forms)
}

export async function POST(req: Request) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, workspaceId } = await req.json()
  if (!title || !workspaceId) {
    return NextResponse.json({ error: 'Title and workspace are required' }, { status: 400 })
  }

  // Verify membership
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, workspaceId },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 })
  }

  const form = await prisma.form.create({
    data: {
      title,
      slug: generateSlug(title),
      fields: JSON.stringify([]),
      settings: JSON.stringify(DEFAULT_FORM_SETTINGS),
      createdById: user.id,
      workspaceId,
    },
  })

  return NextResponse.json(form)
}
