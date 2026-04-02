import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const session = await prisma.formSession.findUnique({
    where: { token: params.token },
    include: {
      form: true,
    },
  })

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.form.status !== 'published') {
    return NextResponse.json({ error: 'Form not available' }, { status: 404 })
  }

  // Mark as opened if first time
  if (!session.openedAt) {
    await prisma.formSession.update({
      where: { id: session.id },
      data: { openedAt: new Date(), status: 'in_progress' },
    })
  }

  return NextResponse.json({
    session: {
      id: session.id,
      token: session.token,
      clientName: session.clientName,
      status: session.status,
    },
    form: {
      id: session.form.id,
      title: session.form.title,
      description: session.form.description,
      fields: JSON.parse(session.form.fields),
      settings: JSON.parse(session.form.settings),
    },
  })
}
