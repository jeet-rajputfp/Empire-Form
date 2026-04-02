import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { v4 as uuid } from 'uuid'

export async function GET(req: Request, { params }: { params: { formId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessions = await prisma.formSession.findMany({
    where: { formId: params.formId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { responses: true } },
    },
  })

  return NextResponse.json(sessions)
}

export async function POST(req: Request, { params }: { params: { formId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await prisma.form.findUnique({ where: { id: params.formId } })
  if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 })

  const { clientName, clientEmail } = await req.json()
  if (!clientName) return NextResponse.json({ error: 'Client name is required' }, { status: 400 })

  const token = uuid().replace(/-/g, '').slice(0, 12)

  const session = await prisma.formSession.create({
    data: {
      token,
      formId: params.formId,
      clientName,
      clientEmail: clientEmail || null,
    },
  })

  return NextResponse.json(session)
}

export async function DELETE(req: Request, { params }: { params: { formId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'Session ID required' }, { status: 400 })

  await prisma.formSession.delete({ where: { id: sessionId } })
  return NextResponse.json({ success: true })
}
