import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: { some: { userId: user.id } },
    },
    include: {
      _count: { select: { forms: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(workspaces)
}

export async function POST(req: Request) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name } = await req.json()
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).slice(2, 6)

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      members: {
        create: { userId: user.id, role: 'owner' },
      },
    },
  })

  return NextResponse.json(workspace)
}
