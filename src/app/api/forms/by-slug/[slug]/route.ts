import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const form = await prisma.form.findUnique({
    where: { slug: params.slug },
  })

  if (!form || form.status !== 'published') {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: form.id,
    title: form.title,
    description: form.description,
    fields: JSON.parse(form.fields),
    settings: JSON.parse(form.settings),
  })
}
