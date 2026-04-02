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
    include: { fileUploads: true },
  })

  // Extract spreadsheet ID from URL
  const sheetUrlMatch = settings.googleSheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
  const spreadsheetId = sheetUrlMatch ? sheetUrlMatch[1] : null

  // Build header row
  const headers = ['Timestamp', ...fields.map((f: any) => f.label)]

  // Build data rows
  const rows = responses.map((r) => {
    const answers = JSON.parse(r.answers)
    const row: string[] = [
      r.submittedAt ? new Date(r.submittedAt).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' }) : '',
    ]

    fields.forEach((field: any) => {
      if (field.type === 'file') {
        // For file uploads, find the matching file and create a link
        const fileUpload = r.fileUploads.find((f) => f.fieldId === field.id)
        if (fileUpload) {
          const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '') || ''
          row.push(`${baseUrl}${fileUpload.path}`)
        } else {
          const val = answers[field.id]
          if (val && typeof val === 'object' && val.path) {
            row.push(val.path)
          } else {
            row.push('')
          }
        }
      } else {
        const val = answers[field.id]
        if (Array.isArray(val)) {
          row.push(val.join(', '))
        } else if (typeof val === 'object' && val) {
          row.push(JSON.stringify(val))
        } else {
          row.push(val || '')
        }
      }
    })

    return row
  })

  return NextResponse.json({
    success: true,
    spreadsheetId,
    sheetUrl: settings.googleSheetUrl,
    headers,
    rows,
    totalResponses: rows.length,
  })
}
