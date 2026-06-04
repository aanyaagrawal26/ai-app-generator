import { getSession } from '@/lib/auth/session'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })
  }
  return Response.json({ userId: session.userId, email: session.email, name: session.name, role: session.role })
}
