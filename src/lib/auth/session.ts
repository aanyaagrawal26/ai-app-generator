import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = process.env.SESSION_SECRET ?? 'fallback-dev-secret-replace-in-prod'
const encodedKey = new TextEncoder().encode(SECRET)

export interface SessionPayload {
  userId:    string
  email:     string
  name?:     string
  role:      string
  expiresAt: string
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(user: { id: string; email: string; name?: string | null; role?: string }): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const token = await encrypt({
    userId:    user.id,
    email:     user.email,
    name:      user.name ?? undefined,
    role:      user.role ?? 'user',
    expiresAt: expiresAt.toISOString(),
  })

  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    expires:  expiresAt,
    sameSite: 'lax',
    path:     '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null
  return decrypt(token)
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function updateSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return

  const payload = await decrypt(token)
  if (!payload) return

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const newToken = await encrypt({ ...payload, expiresAt: expiresAt.toISOString() })

  cookieStore.set('session', newToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    expires:  expiresAt,
    sameSite: 'lax',
    path:     '/',
  })
}
