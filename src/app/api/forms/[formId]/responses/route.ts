import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { formId: string } }) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const responses = await prisma.formResponse.findMany({
    where: { formId: params.formId },
    include: { fileUploads: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    responses.map((r) => ({
      ...r,
      answers: JSON.parse(r.answers),
      files: JSON.parse(r.files),
      metadata: JSON.parse(r.metadata),
    }))
  )
}

export async function POST(req: Request, { params }: { params: { formId: string } }) {
  const body = await req.json()
  const { answers, responseId, sessionToken } = body

  const form = await prisma.form.findUnique({ where: { id: params.formId } })
  if (!form || form.status !== 'published') {
    return NextResponse.json({ error: 'Form not available' }, { status: 404 })
  }

  let response

  if (responseId) {
    response = await prisma.formResponse.update({
      where: { id: responseId },
      data: {
        answers: JSON.stringify(answers),
        status: 'completed',
        submittedAt: new Date(),
        completedAt: new Date(),
        lastSavedAt: new Date(),
      },
      include: { fileUploads: true },
    })

    if (sessionToken) {
      try {
        const session = await prisma.formSession.findUnique({ where: { token: sessionToken } })
        if (session) {
          await prisma.formSession.update({
            where: { id: session.id },
            data: { status: 'completed', completedAt: new Date() },
          })
        }
      } catch {}
    }
  } else {
    response = await prisma.formResponse.create({
      data: {
        formId: params.formId,
        answers: JSON.stringify(answers),
        status: 'completed',
        submittedAt: new Date(),
        completedAt: new Date(),
        metadata: JSON.stringify({
          userAgent: req.headers.get('user-agent') || '',
          submittedAt: new Date().toISOString(),
        }),
      },
      include: { fileUploads: true },
    })
  }

  // Auto-sync to Google Sheets
  const settings = JSON.parse(form.settings)
  if (settings.googleSheetEnabled && settings.googleSheetWebhookUrl) {
    try {
      const fields = JSON.parse(form.fields).filter(
        (f: any) => f.type !== 'heading' && f.type !== 'paragraph'
      )

      const row: Record<string, string> = {
        'Submitted On (UTC)': new Date().toISOString().replace('T', ' ').slice(0, 19),
      }

      fields.forEach((field: any) => {
        if (field.type === 'file') {
          const upload = (response.fileUploads || []).find((f: any) => f.fieldId === field.id)
          if (upload) {
            row[field.label] = upload.path
          } else {
            const val = answers[field.id]
            row[field.label] = val && typeof val === 'object' && val.path ? val.path : ''
          }
        } else {
          const val = answers[field.id]
          if (Array.isArray(val)) {
            row[field.label] = val.join(', ')
          } else if (typeof val === 'object' && val) {
            row[field.label] = val.filename || JSON.stringify(val)
          } else {
            row[field.label] = String(val || '')
          }
        }
      })

      // POST to Google Apps Script webhook (fire and forget)
      fetch(settings.googleSheetWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      }).catch((err) => console.error('Sheet webhook error:', err))
    } catch (error) {
      console.error('Google Sheets auto-sync error:', error)
    }
  }

  return NextResponse.json({
    ...response,
    answers: JSON.parse(response.answers),
  })
}
