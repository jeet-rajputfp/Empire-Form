import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { formId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await prisma.form.findUnique({ where: { id: params.formId } })
  if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 })

  const settings = JSON.parse(form.settings)
  if (!settings.googleSheetEnabled || !settings.googleSheetUrl) {
    return NextResponse.json({ error: 'Google Sheets not configured' }, { status: 400 })
  }

  const fields = JSON.parse(form.fields).filter(
    (f: any) => f.type !== 'heading' && f.type !== 'paragraph'
  )

  const responses = await prisma.formResponse.findMany({
    where: { formId: params.formId, status: 'completed' },
    orderBy: { submittedAt: 'asc' },
  })

  // Build rows data for sheet
  const rows = responses.map((r) => {
    const answers = JSON.parse(r.answers)
    const row: Record<string, string> = {
      Timestamp: r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '',
    }
    fields.forEach((field: any) => {
      const val = answers[field.id]
      row[field.label] = Array.isArray(val) ? val.join(', ') : (val || '')
    })
    return row
  })

  return NextResponse.json({
    success: true,
    sheetUrl: settings.googleSheetUrl,
    headers: ['Timestamp', ...fields.map((f: any) => f.label)],
    rows,
    totalResponses: rows.length,
  })
}
