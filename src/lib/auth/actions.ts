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

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.passwordHash) {
    return { errors: { general: ['Invalid email or password'] } }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return { errors: { general: ['Invalid email or password'] } }
  }

  // Get the user's first app role (default to 'user')
  const appUser = await prisma.appUser.findFirst({ where: { userId: user.id } })

  await createSession({
    id:   user.id,
    email: user.email,
    name:  user.name,
    role:  appUser?.role ?? 'user',
  })

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

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { errors: { email: ['Email already in use'] } }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  })

  await createSession({ id: user.id, email: user.email, name: user.name, role: 'admin' })
  redirect('/dashboard')
}

export async function logout(): Promise<void> {
  await deleteSession()
  redirect('/login')
}
