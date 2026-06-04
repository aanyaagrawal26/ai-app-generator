import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'
import { createSession } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils/apiError'

const RegisterSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = RegisterSchema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json({ error: { code: 'CONFLICT', message: 'Email already in use' } }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({ data: { name, email, passwordHash } })

    await createSession({ id: user.id, email: user.email, name: user.name, role: 'admin' })

    return Response.json({ id: user.id, email: user.email, name: user.name }, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
