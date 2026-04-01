import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: { workspaceId: string } }) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, workspaceId: params.workspaceId },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 })
  }

  const { name } = await req.json()
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const workspace = await prisma.workspace.update({
    where: { id: params.workspaceId },
    data: { name },
  })

  return NextResponse.json(workspace)
}

export async function DELETE(req: Request, { params }: { params: { workspaceId: string } }) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, workspaceId: params.workspaceId, role: 'owner' },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Only workspace owners can delete' }, { status: 403 })
  }

  await prisma.workspace.delete({ where: { id: params.workspaceId } })
  return NextResponse.json({ success: true })
}
