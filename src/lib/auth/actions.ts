'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { createSession, deleteSession } from './session'

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

const RegisterSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(8),
})

export type AuthState = {
  errors?: { email?: string[]; password?: string[]; name?: string[]; general?: string[] }
  message?: string
} | undefined

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const validated = LoginSchema.safeParse({
    email:    formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { email, password } = validated.data

  // DB-touching work is isolated so an infra/schema failure becomes a clean
  // inline error instead of an uncaught Server Component render crash.
  // NOTE: redirect() throws a control-flow signal — it must stay OUT of try/catch.
  let user: Awaited<ReturnType<typeof prisma.user.findUnique>> = null
  let role = 'user'
  try {
    user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      const appUser = await prisma.appUser.findFirst({ where: { userId: user.id } })
      role = appUser?.role ?? 'user'
    }
  } catch (err) {
    console.error('[auth.login] database error:', err)
    return { errors: { general: ['We couldn’t reach the service right now. Please try again shortly.'] } }
  }

  if (!user || !user.passwordHash) {
    return { errors: { general: ['Invalid email or password'] } }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return { errors: { general: ['Invalid email or password'] } }
  }

  await createSession({ id: user.id, email: user.email, name: user.name, role })

  redirect('/dashboard')
}

export async function register(_state: AuthState, formData: FormData): Promise<AuthState> {
  const validated = RegisterSchema.safeParse({
    name:     formData.get('name'),
    email:    formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { name, email, password } = validated.data

  // Same isolation as login: keep redirect() outside the try/catch.
  let user: Awaited<ReturnType<typeof prisma.user.create>> | null = null
  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return { errors: { email: ['Email already in use'] } }
    }
    const passwordHash = await bcrypt.hash(password, 12)
    user = await prisma.user.create({ data: { name, email, passwordHash } })
  } catch (err) {
    console.error('[auth.register] database error:', err)
    return { errors: { general: ['We couldn’t create your account right now. Please try again shortly.'] } }
  }

  if (!user) {
    return { errors: { general: ['We couldn’t create your account right now. Please try again shortly.'] } }
  }

  await createSession({ id: user.id, email: user.email, name: user.name, role: 'admin' })
  redirect('/dashboard')
}

export async function logout(): Promise<void> {
  await deleteSession()
  redirect('/login')
}
