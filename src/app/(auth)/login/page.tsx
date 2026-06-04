'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/lib/auth/actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="animate-modal">
      {/* Logo / heading */}
      <div className="text-center mb-8 animate-fade-up" style={{animationFillMode:'forwards'}}>
        <div className="relative inline-flex items-center justify-center mb-5">
          <div className="w-16 h-16 gradient-animated rounded-2xl flex items-center justify-center text-white text-3xl shadow-2xl animate-pulse-glow">
            ⚡
          </div>
          {/* outer ring */}
          <div className="absolute inset-0 rounded-2xl animate-spin-slow opacity-30"
            style={{background:'conic-gradient(from 0deg, transparent 60%, #6366f1, transparent 65%)', inset:'-4px'}} />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Welcome back</h1>
        <p className="text-slate-400 text-sm mt-1.5">Sign in to AI App Generator</p>
      </div>

      {/* Card */}
      <div className="glass rounded-3xl p-8 shadow-2xl animate-fade-up delay-100" style={{animationFillMode:'forwards'}}>
        {state?.errors?.general && (
          <div className="mb-5 flex items-start gap-3 rounded-xl p-3.5 text-sm animate-scale-in"
            style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)'}}>
            <span className="text-red-400 shrink-0 text-base">⚠</span>
            <span className="text-red-300">{state.errors.general.join(', ')}</span>
          </div>
        )}

        <form action={action} className="space-y-5">
          {/* Email */}
          <div className="opacity-0-init animate-fade-up delay-200" style={{animationFillMode:'forwards'}}>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Email address
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors text-sm">
                ✉
              </div>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                className="w-full text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3.5 text-sm transition-all duration-300 focus:ring-1 focus:ring-indigo-500/60"
                style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}
                placeholder="you@example.com"
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(99,102,241,0.6)'; e.currentTarget.style.background = 'rgba(99,102,241,0.05)' }}
                onBlur={e  => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              />
            </div>
            {state?.errors?.email && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <span>⚠</span>{state.errors.email.join(', ')}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="opacity-0-init animate-fade-up delay-300" style={{animationFillMode:'forwards'}}>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors text-sm">
                🔑
              </div>
              <input
                id="password" name="password" type="password" autoComplete="current-password" required
                className="w-full text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3.5 text-sm transition-all duration-300"
                style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}
                placeholder="••••••••"
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(99,102,241,0.6)'; e.currentTarget.style.background = 'rgba(99,102,241,0.05)' }}
                onBlur={e  => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              />
            </div>
            {state?.errors?.password && (
              <p className="text-red-400 text-xs mt-1.5">{state.errors.password.join(', ')}</p>
            )}
          </div>

          {/* Submit */}
          <div className="opacity-0-init animate-fade-up delay-400 pt-2" style={{animationFillMode:'forwards'}}>
            <button
              type="submit" disabled={pending}
              className="relative w-full py-4 rounded-xl font-bold text-white text-sm overflow-hidden gradient-animated hover:opacity-90 disabled:opacity-50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in
                  <span>→</span>
                </span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Footer links */}
      <p className="text-center text-sm text-slate-500 mt-6 animate-fade-up delay-500" style={{animationFillMode:'forwards'}}>
        No account?{' '}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
          Create one free
        </Link>
      </p>

      {/* Demo hint */}
      <div className="mt-4 animate-fade-up delay-600" style={{animationFillMode:'forwards'}}>
        <div className="rounded-xl px-4 py-3 text-center" style={{background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.15)'}}>
          <p className="text-xs text-slate-500 font-medium">
            <span className="text-indigo-400">Demo credentials</span>
            {' '}—{' '}
            <span className="font-mono text-slate-400">admin@demo.com</span>
            {' / '}
            <span className="font-mono text-slate-400">password123</span>
          </p>
        </div>
      </div>
    </div>
  )
}
