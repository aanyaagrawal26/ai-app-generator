import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../src/generated/prisma/client'

async function main() {
  const adapter = new PrismaLibSql({ url: 'file:./prisma/dev.db' })
  const prisma = new (PrismaClient as any)({ adapter }) as PrismaClient
  const users = await prisma.user.findMany()
  console.log('✅ DB works! Users:', users.length, users.map((u: any) => u.email))
  await prisma.$disconnect()
}
main().catch(e => { console.error('❌', e.message); process.exit(1) })
