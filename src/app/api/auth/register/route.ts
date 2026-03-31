import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'admin' },
    })

    // Create default workspace for new user
    const workspace = await prisma.workspace.create({
      data: {
        name: `${name || email}'s Workspace`,
        slug: `workspace-${user.id.slice(0, 8)}`,
        members: {
          create: { userId: user.id, role: 'owner' },
        },
      },
    })

    return NextResponse.json({ id: user.id, email: user.email })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
