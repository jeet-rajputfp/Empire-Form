const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@empireform.com' },
    update: {},
    create: {
      email: 'admin@empireform.com',
      name: 'Admin User',
      passwordHash,
      role: 'admin',
    },
  })

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'default-workspace' },
    update: {},
    create: {
      name: 'Default Workspace',
      slug: 'default-workspace',
    },
  })

  await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: admin.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      workspaceId: workspace.id,
      role: 'owner',
    },
  })

  console.log('Seed completed:', { admin: admin.email, workspace: workspace.name })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
