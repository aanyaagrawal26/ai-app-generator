import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

function makePrisma() {
  const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
  const adapter = new PrismaLibSql({ url })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (PrismaClient as any)({ adapter }) as PrismaClient
}

const g = globalThis as unknown as { prisma?: PrismaClient }
export const prisma: PrismaClient = g.prisma ?? makePrisma()
if (process.env.NODE_ENV !== 'production') g.prisma = prisma
