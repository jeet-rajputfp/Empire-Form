import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { formId: string } }) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await prisma.form.findUnique({ where: { id: params.formId } })
  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }

  const [totalResponses, completedResponses, inProgressResponses, recentResponses] =
    await Promise.all([
      prisma.formResponse.count({ where: { formId: params.formId } }),
      prisma.formResponse.count({ where: { formId: params.formId, status: 'completed' } }),
      prisma.formResponse.count({ where: { formId: params.formId, status: 'in_progress' } }),
      prisma.formResponse.findMany({
        where: { formId: params.formId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          createdAt: true,
          submittedAt: true,
          completedAt: true,
        },
      }),
    ])

  // Daily submission counts for last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const dailyResponses = await prisma.formResponse.findMany({
    where: {
      formId: params.formId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { createdAt: true, status: true },
    orderBy: { createdAt: 'asc' },
  })

  const dailyCounts: Record<string, number> = {}
  dailyResponses.forEach((r) => {
    const day = r.createdAt.toISOString().split('T')[0]
    dailyCounts[day] = (dailyCounts[day] || 0) + 1
  })

  return NextResponse.json({
    totalResponses,
    completedResponses,
    inProgressResponses,
    completionRate: totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0,
    recentResponses,
    dailyCounts,
  })
}
