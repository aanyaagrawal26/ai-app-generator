import { PrismaClient } from '../src/generated/prisma/client'
import bcrypt from 'bcryptjs'
import exampleConfig from '../docs/example-app.config.json'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database…')

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 12)
  const user = await prisma.user.upsert({
    where:  { email: 'admin@demo.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@demo.com', passwordHash },
  })
  console.log(`User: ${user.email}`)

  // Create example CRM app from docs/example-app.config.json
  const existing = await prisma.app.findFirst({ where: { ownerId: user.id, name: exampleConfig.name } })
  if (!existing) {
    const app = await prisma.app.create({
      data: {
        name:        exampleConfig.name,
        description: exampleConfig.description,
        configJson:  exampleConfig as object,
        ownerId:     user.id,
        isPublished: true,
      },
    })
    await prisma.appUser.create({ data: { appId: app.id, userId: user.id, role: 'admin' } })
    console.log(`App created: ${app.name} (${app.id})`)

    // Seed some demo records
    const contacts = [
      { firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com', status: 'customer', score: 85 },
      { firstName: 'Bob',   lastName: 'Smith',   email: 'bob@example.com',   status: 'lead',     score: 42 },
      { firstName: 'Carol', lastName: 'White',   email: 'carol@example.com', status: 'prospect', score: 67 },
    ]
    for (const contact of contacts) {
      await prisma.dynamicRecord.create({
        data: { appId: app.id, resourceName: 'contacts', data: contact as object, createdBy: user.id },
      })
    }
    const deals = [
      { title: 'Enterprise deal', value: 15000, stage: 'proposal',    contactId: null },
      { title: 'Starter plan',    value: 1200,  stage: 'closed_won',  contactId: null },
      { title: 'Renewal',         value: 4500,  stage: 'negotiation', contactId: null },
    ]
    for (const deal of deals) {
      await prisma.dynamicRecord.create({
        data: { appId: app.id, resourceName: 'deals', data: deal as object, createdBy: user.id },
      })
    }
    console.log('Demo records seeded')
  }

  console.log('Done.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
