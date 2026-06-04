'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/lib/auth/actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-2">⚡</div>
        <h1 className="text-2xl font-bold text-gray-900">AI App Generator</h1>
        <p className="text-gray-500 mt-1 text-sm">Sign in to your account</p>
      </div>

      {state?.errors?.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {state.errors.general.join(', ')}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            placeholder="you@example.com"
          />
          {state?.errors?.email && (
            <p className="text-red-600 text-xs mt-1">{state.errors.email.join(', ')}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            placeholder="••••••••"
          />
          {state?.errors?.password && (
            <p className="text-red-600 text-xs mt-1">{state.errors.password.join(', ')}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {pending ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        No account?{' '}
        <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Create one
        </Link>
      </p>
    </div>
  )
}
