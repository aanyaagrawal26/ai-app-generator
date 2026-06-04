import { NextRequest } from 'next/server'
import { AppConfigSchema } from '@/lib/config/schema'
import { errorResponse } from '@/lib/utils/apiError'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = AppConfigSchema.safeParse(body)

    if (result.success) {
      return Response.json({ valid: true, config: result.data, errors: [] })
    }

    const errors = result.error.issues.map(i => ({
      path:    i.path.join('.'),
      message: i.message,
    }))

    return Response.json({ valid: false, errors })
  } catch (err) {
    return errorResponse(err)
  }
}
