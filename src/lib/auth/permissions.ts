import type { SessionPayload } from './session'

export function hasPermission(
  session: SessionPayload | null,
  allowed: string[]
): boolean {
  if (allowed.includes('*')) return true
  if (!session) return false
  if (allowed.includes(session.role)) return true
  return false
}

export function requireAuth(session: SessionPayload | null): void {
  if (!session) throw new Error('UNAUTHENTICATED')
}

export function requirePermission(
  session: SessionPayload | null,
  allowed: string[]
): void {
  requireAuth(session)
  if (!hasPermission(session, allowed)) {
    throw new Error('FORBIDDEN')
  }
}
