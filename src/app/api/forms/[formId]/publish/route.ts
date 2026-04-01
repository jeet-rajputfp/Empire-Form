import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { formId: string } }) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await prisma.form.findUnique({ where: { id: params.formId } })
  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }

  const fields = JSON.parse(form.fields)
  if (fields.length === 0) {
    return NextResponse.json({ error: 'Cannot publish a form with no fields' }, { status: 400 })
  }

  const updated = await prisma.form.update({
    where: { id: params.formId },
    data: { status: form.status === 'published' ? 'draft' : 'published' },
  })

  return NextResponse.json(updated)
}
