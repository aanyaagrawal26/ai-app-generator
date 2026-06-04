import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    const fields: Record<string, string[]> = {}
    const flat = err.flatten()
    for (const [k, msgs] of Object.entries(flat.fieldErrors)) {
      fields[k] = (msgs as string[]) ?? []
    }
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields } },
      { status: 422 }
    )
  }
  if (err instanceof Error) {
    if (err.message === 'UNAUTHENTICATED')
      return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }, { status: 401 })
    if (err.message === 'FORBIDDEN')
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, { status: 403 })
    if (err.message.startsWith('App not found'))
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: err.message } }, { status: 404 })
  }
  console.error('[API Error]', err)
  return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 })
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number): NextResponse {
  return NextResponse.json({ data, total, page, limit, pages: Math.ceil(total / limit) })
}
