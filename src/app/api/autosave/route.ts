import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { formId, responseId, answers } = await req.json()

    if (!formId || !answers) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Update existing response or create new one
    if (responseId) {
      const response = await prisma.formResponse.update({
        where: { id: responseId },
        data: {
          answers: JSON.stringify(answers),
          lastSavedAt: new Date(),
        },
      })
      return NextResponse.json({ responseId: response.id, savedAt: response.lastSavedAt })
    }

    // Create new in-progress response
    const response = await prisma.formResponse.create({
      data: {
        formId,
        answers: JSON.stringify(answers),
        status: 'in_progress',
        metadata: JSON.stringify({
          userAgent: req.headers.get('user-agent') || '',
          startedAt: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({ responseId: response.id, savedAt: response.lastSavedAt })
  } catch (error) {
    console.error('Auto-save error:', error)
    return NextResponse.json({ error: 'Auto-save failed' }, { status: 500 })
  }
}
