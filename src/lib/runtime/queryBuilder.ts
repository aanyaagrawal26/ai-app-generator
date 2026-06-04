import type { Field } from '@/lib/config/schema'

export interface ListQuery {
  page:    number
  limit:   number
  sort?:   string
  order?:  'asc' | 'desc'
  filter?: Record<string, unknown>
  search?: string
}

export function parseListQuery(url: URL): ListQuery {
  const page  = Math.max(1, Number(url.searchParams.get('page')  ?? 1))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20)))
  const sort  = url.searchParams.get('sort')  ?? undefined
  const order = (url.searchParams.get('order') ?? 'desc') as 'asc' | 'desc'

  let filter: Record<string, unknown> | undefined
  const fp = url.searchParams.get('filter')
  if (fp) { try { filter = JSON.parse(decodeURIComponent(fp)) } catch { /* ignore */ } }

  const search = url.searchParams.get('search') ?? undefined
  return { page, limit, sort, order, filter, search }
}

export function buildPrismaQuery(query: ListQuery, fields: Field[]) {
  const { page, limit, sort, order, filter, search } = query
  const where: Record<string, unknown> = {}

  if (filter) Object.assign(where, filter)

  if (search) {
    const textFields = fields.filter(f => ['text','email','url','richtext'].includes(f.type))
    if (textFields.length > 0) {
      where.OR = textFields.map(f => ({ [f.name]: { contains: search, mode: 'insensitive' } }))
    }
  }

  const orderBy: Record<string, string> = sort ? { [sort]: order ?? 'desc' } : { createdAt: 'desc' }

  return {
    skip:    (page - 1) * limit,
    take:    limit,
    orderBy,
    where:   Object.keys(where).length > 0 ? where : undefined,
  }
}
