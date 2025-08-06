const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Creating demo users...')

  // Create demo user 1
  const user1 = await prisma.user.upsert({
    where: { email: 'demo1@example.com' },
    update: {},
    create: {
      email: 'demo1@example.com',
      name: 'Demo User 1',
      password: 'password',
    },
  })

  // Create demo user 2
  const user2 = await prisma.user.upsert({
    where: { email: 'demo2@example.com' },
    update: {},
    create: {
      email: 'demo2@example.com',
      name: 'Demo User 2',
      password: 'password',
    },
  })

  console.log('Demo users created:')
  console.log('User 1:', { id: user1.id, email: user1.email, name: user1.name })
  console.log('User 2:', { id: user2.id, email: user2.email, name: user2.name })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })