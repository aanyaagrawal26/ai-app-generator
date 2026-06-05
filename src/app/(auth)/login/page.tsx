'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/lib/auth/actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="animate-modal">
      {/* Brand */}
      <div className="text-center mb-8 animate-fade-up">
        <div className="relative inline-block mb-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl animate-pulse-glow mx-auto" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)'}}>
            ⚡
          </div>
          {/* ring */}
          <div className="absolute inset-0 rounded-2xl animate-ping-slow opacity-30" style={{background:'linear-gradient(135deg,#6366f1,#ec4899)'}} />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Welcome back</h1>
        <p className="text-slate-400 text-sm mt-1.5">Sign in to AI App Generator</p>
      </div>

      {/* Card */}
      <div className="glass rounded-3xl p-8 shadow-2xl animate-fade-up delay-100" style={{animationFillMode:'both'}}>
        {state?.errors?.general && (
          <div className="mb-5 flex items-start gap-3 rounded-xl p-3.5 text-sm animate-scale-in"
            style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.25)'}}>
            <span className="text-red-400 shrink-0">⚠</span>
            <span className="text-red-300">{state.errors.general.join(', ')}</span>
          </div>
        )}

        <form action={action} className="space-y-5">
          {/* Email */}
          <div className="animate-fade-up delay-150" style={{animationFillMode:'both'}}>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email address</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">✉</span>
              <input id="email" name="email" type="email" autoComplete="email" required
                suppressHydrationWarning
                className="w-full pl-11 pr-4 py-3.5 text-sm text-white rounded-xl placeholder-slate-600 transition-all duration-300 focus:ring-2 focus:ring-indigo-500/50"
                style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)'}}
                placeholder="you@example.com" />
            </div>
            {state?.errors?.email && <p className="text-red-400 text-xs mt-1.5">{state.errors.email.join(', ')}</p>}
          </div>

          {/* Password */}
          <div className="animate-fade-up delay-200" style={{animationFillMode:'both'}}>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔒</span>
              <input id="password" name="password" type="password" autoComplete="current-password" required
                suppressHydrationWarning
                className="w-full pl-11 pr-4 py-3.5 text-sm text-white rounded-xl placeholder-slate-600 transition-all duration-300 focus:ring-2 focus:ring-indigo-500/50"
                style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)'}}
                placeholder="••••••••" />
            </div>
            {state?.errors?.password && <p className="text-red-400 text-xs mt-1.5">{state.errors.password.join(', ')}</p>}
          </div>

          {/* Submit */}
          <div className="animate-fade-up delay-300 pt-1" style={{animationFillMode:'both'}}>
            <button type="submit" disabled={pending}
              className="relative w-full py-3.5 rounded-xl font-black text-white text-sm overflow-hidden disabled:opacity-50 hover:scale-[1.02] active:scale-[.98] transition-transform duration-200 shadow-xl beam-effect"
              style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)'}}>
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

      <p className="text-center text-sm text-slate-500 mt-6 animate-fade-up delay-400" style={{animationFillMode:'both'}}>
        No account?{' '}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Create one free</Link>
      </p>

      {/* Demo hint */}
      <div className="mt-4 text-center animate-fade-up delay-500" style={{animationFillMode:'both'}}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-slate-500" style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)'}}>
          <span className="text-indigo-400">🎯</span>
          Demo: <code className="text-slate-300 ml-1">admin@demo.com</code> / <code className="text-slate-300">password123</code>
        </div>
      </div>
    </div>
  )
}
