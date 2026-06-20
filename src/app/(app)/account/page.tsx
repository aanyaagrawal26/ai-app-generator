import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import AccountClient from './AccountClient'

export default async function AccountPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [apps, user] = await Promise.all([
    prisma.app.findMany({ where: { ownerId: session.userId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: session.userId }, select: { createdAt: true } }),
  ])
  const recordCount = await prisma.dynamicRecord.count({
    where: { appId: { in: apps.map(a => a.id) }, deletedAt: null },
  })
  const appCount = apps.length

  return (
    <AccountClient
      user={{
        name: session.name ?? null,
        email: session.email,
        role: session.role,
        memberSince: user?.createdAt?.toISOString() ?? null,
      }}
      stats={{ apps: appCount, records: recordCount }}
    />
  )
}
