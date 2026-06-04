'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/lib/auth/actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="animate-modal">
      {/* logo */}
      <div className="text-center mb-8 animate-fade-up">
        <div className="inline-flex items-center justify-center w-14 h-14 gradient-animated rounded-2xl text-white font-black text-2xl mb-4 animate-pulse-glow">
          ⚡
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Welcome back</h1>
        <p className="text-slate-400 text-sm mt-1">Sign in to AI App Generator</p>
      </div>

      {/* card */}
      <div className="glass rounded-3xl p-8 shadow-2xl animate-fade-up delay-100" style={{animationFillMode:'forwards'}}>
        {state?.errors?.general && (
          <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-3 text-sm animate-scale-in">
            <span className="text-base shrink-0">⚠️</span>
            {state.errors.general.join(', ')}
          </div>
        )}

        <form action={action} className="space-y-5">
          <div className="animate-fade-up delay-200" style={{animationFillMode:'forwards'}}>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email address
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-base">✉</span>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white/8 transition-all duration-300"
                placeholder="you@example.com"
              />
            </div>
            {state?.errors?.email && <p className="text-red-400 text-xs mt-1.5">{state.errors.email.join(', ')}</p>}
          </div>

          <div className="animate-fade-up delay-300" style={{animationFillMode:'forwards'}}>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-base">🔑</span>
              <input
                id="password" name="password" type="password" autoComplete="current-password" required
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white/8 transition-all duration-300"
                placeholder="••••••••"
              />
            </div>
            {state?.errors?.password && <p className="text-red-400 text-xs mt-1.5">{state.errors.password.join(', ')}</p>}
          </div>

          <div className="animate-fade-up delay-400 pt-1" style={{animationFillMode:'forwards'}}>
            <button
              type="submit" disabled={pending}
              className="relative w-full py-3.5 rounded-xl font-bold text-white text-sm overflow-hidden gradient-animated hover:opacity-90 disabled:opacity-50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in →'}
            </button>
          </div>
        </form>
      </div>

      <p className="text-center text-sm text-slate-500 mt-6 animate-fade-up delay-500" style={{animationFillMode:'forwards'}}>
        No account?{' '}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
          Create one free
        </Link>
      </p>

      <p className="text-center text-xs text-slate-700 mt-3 animate-fade-up delay-600" style={{animationFillMode:'forwards'}}>
        Demo: admin@demo.com · password123
      </p>
    </div>
  )
}
