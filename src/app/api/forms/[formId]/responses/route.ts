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
      const session = await prisma.formSession.findUnique({ where: { token: sessionToken } })
      if (session) {
        await prisma.formSession.update({
          where: { id: session.id },
          data: { status: 'completed', completedAt: new Date() },
        })
      }
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

  // Sync to Google Sheets via webhook if enabled
  const settings = JSON.parse(form.settings)
  if (settings.googleSheetEnabled && settings.googleSheetWebhookUrl) {
    try {
      const fields = JSON.parse(form.fields).filter(
        (f: any) => f.type !== 'heading' && f.type !== 'paragraph'
      )

      const row: Record<string, string> = {
        'Submitted On (UTC)': new Date().toISOString(),
      }

      fields.forEach((field: any) => {
        if (field.type === 'file') {
          const upload = (response.fileUploads || []).find((f: any) => f.fieldId === field.id)
          row[field.label] = upload ? upload.path : (answers[field.id]?.path || '')
        } else {
          const val = answers[field.id]
          row[field.label] = Array.isArray(val) ? val.join(', ') : String(val || '')
        }
      })

      await fetch(settings.googleSheetWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      }).catch(console.error)
    } catch (error) {
      console.error('Google Sheets webhook error:', error)
    }
  }

  return NextResponse.json({
    ...response,
    answers: JSON.parse(response.answers),
  })
}
