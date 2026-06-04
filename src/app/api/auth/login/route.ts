import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'
import { createSession } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils/apiError'

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = LoginSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return Response.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return Response.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } }, { status: 401 })
    }

    const appUser = await prisma.appUser.findFirst({ where: { userId: user.id } })
    await createSession({ id: user.id, email: user.email, name: user.name, role: appUser?.role ?? 'user' })

    return Response.json({ id: user.id, email: user.email, name: user.name })
  } catch (err) {
    return errorResponse(err)
  }
}
