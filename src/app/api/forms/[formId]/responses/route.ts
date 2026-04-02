import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createOrAppendGoogleDoc, getGoogleAuth } from '@/lib/google'

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

  // Complete an existing in-progress response
  if (responseId) {
    const response = await prisma.formResponse.update({
      where: { id: responseId },
      data: {
        answers: JSON.stringify(answers),
        status: 'completed',
        submittedAt: new Date(),
        completedAt: new Date(),
        lastSavedAt: new Date(),
      },
    })

    // Mark session as completed if applicable
    if (sessionToken) {
      const session = await prisma.formSession.findUnique({ where: { token: sessionToken } })
      if (session) {
        await prisma.formSession.update({
          where: { id: session.id },
          data: { status: 'completed', completedAt: new Date() },
        })
      }
    }

    // Sync to Google Docs if enabled
    const settings = JSON.parse(form.settings)
    if (settings.googleDocSync) {
      try {
        const auth = getGoogleAuth()
        if (auth) {
          const fields = JSON.parse(form.fields)
          const content = formatResponseForDoc(form.title, fields, answers)
          const docId = await createOrAppendGoogleDoc(form.googleDocId, `${form.title} - Responses`, content, auth)

          if (!form.googleDocId) {
            await prisma.form.update({
              where: { id: form.id },
              data: { googleDocId: docId },
            })
          }
        }
      } catch (error) {
        console.error('Google Docs sync error:', error)
      }
    }

    return NextResponse.json({
      ...response,
      answers: JSON.parse(response.answers),
    })
  }

  // Create new response
  const response = await prisma.formResponse.create({
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
  })

  return NextResponse.json({
    ...response,
    answers: JSON.parse(response.answers),
  })
}

function formatResponseForDoc(title: string, fields: any[], answers: Record<string, any>): string {
  let content = `Response submitted at ${new Date().toLocaleString()}\n\n`
  for (const field of fields) {
    if (field.type === 'heading' || field.type === 'paragraph') continue
    const answer = answers[field.id]
    const value = Array.isArray(answer) ? answer.join(', ') : answer || '(no answer)'
    content += `${field.label}: ${value}\n`
  }
  return content
}
