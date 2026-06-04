import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../src/generated/prisma/client'
import bcrypt from 'bcryptjs'

const DB_PATH = process.env['DATABASE_URL'] ?? 'file:./prisma/dev.db'

async function main() {
  const adapter = new PrismaLibSql({ url: DB_PATH })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma = new (PrismaClient as any)({ adapter }) as PrismaClient

  console.log('🌱 Seeding database…')

  const passwordHash = await bcrypt.hash('password123', 12)

  const user = await prisma.user.upsert({
    where:  { email: 'admin@demo.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@demo.com', passwordHash },
  })
  console.log(`✓ User: ${user.email}`)

  const exampleConfig = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'CRM Platform',
    version: '1.0.0',
    description: 'A simple CRM built from JSON config',
    auth: { providers: ['credentials'], defaultRole: 'user', roles: [], sessionType: 'jwt', sessionMaxAge: 86400 },
    i18n: { defaultLocale: 'en', supportedLocales: ['en', 'fr', 'de', 'es'], namespaces: ['common'] },
    theme: { primaryColor: '#6366f1', fontFamily: 'Inter', borderRadius: 'md', darkMode: false },
    resources: [
      {
        name: 'contacts', label: 'Contacts', timestamps: true, softDelete: true, actions: [],
        permissions: { create: ['admin', 'manager'], read: ['*'], update: ['admin', 'manager'], delete: ['admin'] },
        fields: [
          { name: 'firstName', type: 'text',   label: 'First Name', required: true,  unique: false },
          { name: 'lastName',  type: 'text',   label: 'Last Name',  required: true,  unique: false },
          { name: 'email',     type: 'email',  label: 'Email',      required: true,  unique: true  },
          { name: 'phone',     type: 'text',   label: 'Phone',      required: false, unique: false },
          { name: 'status',    type: 'select', label: 'Status',     required: false, unique: false, options: ['lead','prospect','customer','churned'], defaultValue: 'lead' },
          { name: 'score',     type: 'number', label: 'Lead Score', required: false, unique: false, validation: { min: 0, max: 100 } },
        ],
      },
      {
        name: 'deals', label: 'Deals', timestamps: true, softDelete: false, actions: [],
        permissions: { create: ['admin','manager'], read: ['admin','manager','user'], update: ['admin','manager'], delete: ['admin'] },
        fields: [
          { name: 'title',   type: 'text',   label: 'Deal Title', required: true,  unique: false },
          { name: 'value',   type: 'number', label: 'Value ($)',  required: true,  unique: false },
          { name: 'stage',   type: 'select', label: 'Stage',      required: false, unique: false, options: ['qualified','proposal','negotiation','closed_won','closed_lost'], defaultValue: 'qualified' },
        ],
      },
    ],
    pages: [
      {
        path: '/contacts', title: 'Contacts', layout: 'default', permissions: ['*'],
        components: [
          { id: 'stat-contacts', type: 'stat',  resource: 'contacts', config: { label: 'Total Contacts', aggregation: 'count' }, children: [] },
          { id: 'tbl-contacts',  type: 'table', resource: 'contacts', title: 'All Contacts', config: { columns: ['firstName','lastName','email','status','score'], searchable: true, actions: true }, children: [] },
        ],
      },
      {
        path: '/deals', title: 'Deals Pipeline', layout: 'default', permissions: ['*'],
        components: [
          { id: 'kanban-deals', type: 'kanban', resource: 'deals', config: { groupBy: 'stage', cardFields: ['title','value'] }, children: [] },
        ],
      },
    ],
    workflows: [
      {
        id: 'wf-welcome', name: 'Welcome email on new contact', enabled: true,
        trigger: { type: 'record.created', resource: 'contacts' },
        steps: [
          { id: 'send-email', type: 'send_email', config: { to: '{{record.email}}', subject: 'Welcome {{record.firstName}}!', html: '<p>Thanks for joining!</p>' }, onSuccess: null, onFailure: null },
        ],
      },
    ],
  }

  const existing = await prisma.app.findFirst({ where: { ownerId: user.id, name: 'CRM Platform' } })
  const app = existing ?? await prisma.app.create({
    data: {
      name: 'CRM Platform',
      description: 'A demo CRM app',
      configJson: JSON.stringify(exampleConfig),
      ownerId: user.id,
      isPublished: true,
    },
  })
  console.log(`✓ App: ${app.name} (${app.id})`)

  if (!existing) {
    await prisma.appUser.create({ data: { appId: app.id, userId: user.id, role: 'admin' } })

    const contacts = [
      { firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com', status: 'customer', score: 85, phone: '555-0001' },
      { firstName: 'Bob',   lastName: 'Smith',   email: 'bob@example.com',   status: 'lead',     score: 42, phone: '555-0002' },
      { firstName: 'Carol', lastName: 'White',   email: 'carol@example.com', status: 'prospect', score: 67, phone: '555-0003' },
      { firstName: 'David', lastName: 'Lee',     email: 'david@example.com', status: 'customer', score: 91, phone: '555-0004' },
      { firstName: 'Emma',  lastName: 'Davis',   email: 'emma@example.com',  status: 'lead',     score: 30, phone: '555-0005' },
    ]
    for (const c of contacts) {
      await prisma.dynamicRecord.create({
        data: { appId: app.id, resourceName: 'contacts', data: JSON.stringify(c), createdBy: user.id },
      })
    }

    const deals = [
      { title: 'Enterprise deal',  value: 15000, stage: 'proposal'    },
      { title: 'Starter plan',     value: 1200,  stage: 'closed_won'  },
      { title: 'Renewal',          value: 4500,  stage: 'negotiation' },
      { title: 'New expansion',    value: 8000,  stage: 'qualified'   },
      { title: 'Premium upgrade',  value: 6500,  stage: 'closed_won'  },
    ]
    for (const d of deals) {
      await prisma.dynamicRecord.create({
        data: { appId: app.id, resourceName: 'deals', data: JSON.stringify(d), createdBy: user.id },
      })
    }
    console.log(`✓ Seeded ${contacts.length} contacts, ${deals.length} deals`)
  }

  console.log('\n✅ Done! Login with: admin@demo.com / password123')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
