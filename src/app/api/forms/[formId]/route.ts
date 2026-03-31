import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { formId: string } }) {
  const form = await prisma.form.findUnique({
    where: { id: params.formId },
    include: {
      _count: { select: { responses: true } },
      workspace: { select: { name: true } },
    },
  })

  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...form,
    fields: JSON.parse(form.fields),
    settings: JSON.parse(form.settings),
  })
}

export async function PUT(req: Request, { params }: { params: { formId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, description, fields, settings, status } = body

  const form = await prisma.form.findUnique({ where: { id: params.formId } })
  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }

  const updateData: any = {}
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (fields !== undefined) updateData.fields = JSON.stringify(fields)
  if (settings !== undefined) updateData.settings = JSON.stringify(settings)
  if (status !== undefined) updateData.status = status

  // Version the form on field changes
  if (fields !== undefined) {
    updateData.version = form.version + 1

    await prisma.formVersion.create({
      data: {
        formId: form.id,
        version: form.version,
        fields: form.fields,
        settings: form.settings,
      },
    })
  }

  const updated = await prisma.form.update({
    where: { id: params.formId },
    data: updateData,
  })

  return NextResponse.json({
    ...updated,
    fields: JSON.parse(updated.fields),
    settings: JSON.parse(updated.settings),
  })
}

export async function DELETE(req: Request, { params }: { params: { formId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.form.delete({ where: { id: params.formId } })
  return NextResponse.json({ success: true })
}
