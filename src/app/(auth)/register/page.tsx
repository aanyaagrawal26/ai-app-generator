'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register } from '@/lib/auth/actions'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined)

  const fields = [
    { id: 'name',     label: 'Full name',      icon: '👤', type: 'text',     auto: 'name',         ph: 'Jane Smith',      err: state?.errors?.name },
    { id: 'email',   label: 'Email address',   icon: '✉',  type: 'email',    auto: 'email',        ph: 'you@example.com', err: state?.errors?.email },
    { id: 'password',label: 'Password',        icon: '🔑', type: 'password', auto: 'new-password', ph: 'Min. 8 characters', err: state?.errors?.password },
  ] as const

  return (
    <div className="animate-modal">
      {/* Logo / heading */}
      <div className="text-center mb-8 animate-fade-up" style={{animationFillMode:'forwards'}}>
        <div className="relative inline-flex items-center justify-center mb-5">
          <div className="w-16 h-16 gradient-animated rounded-2xl flex items-center justify-center text-white text-3xl shadow-2xl animate-pulse-glow-pink">
            ✨
          </div>
          <div className="absolute inset-0 rounded-2xl animate-spin-slow opacity-30"
            style={{background:'conic-gradient(from 0deg, transparent 60%, #ec4899, transparent 65%)', inset:'-4px'}} />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Create account</h1>
        <p className="text-slate-400 text-sm mt-1.5">Start building apps from JSON — free forever</p>
      </div>

      {/* Card */}
      <div className="glass rounded-3xl p-8 shadow-2xl animate-fade-up delay-100" style={{animationFillMode:'forwards'}}>
        {state?.errors?.general && (
          <div className="mb-5 flex items-start gap-3 rounded-xl p-3.5 text-sm animate-scale-in"
            style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)'}}>
            <span className="text-red-400 shrink-0">⚠</span>
            <span className="text-red-300">{state.errors.general.join(', ')}</span>
          </div>
        )}

        <form action={action} className="space-y-5">
          {fields.map((f, i) => (
            <div
              key={f.id}
              className="opacity-0-init animate-fade-up"
              style={{animationDelay:`${(i + 2) * 0.1}s`, animationFillMode:'forwards'}}
            >
              <label htmlFor={f.id} className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                {f.label}
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors text-sm select-none">
                  {f.icon}
                </div>
                <input
                  id={f.id} name={f.id} type={f.type} autoComplete={f.auto} required
                  className="w-full text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3.5 text-sm transition-all duration-300"
                  style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}
                  placeholder={f.ph}
                  onFocus={e => { e.currentTarget.style.border = '1px solid rgba(99,102,241,0.6)'; e.currentTarget.style.background = 'rgba(99,102,241,0.05)' }}
                  onBlur={e  => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                />
              </div>
              {f.err && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠</span>{f.err.join(', ')}
                </p>
              )}
            </div>
          ))}

          <div className="opacity-0-init animate-fade-up delay-500 pt-2" style={{animationFillMode:'forwards'}}>
            <button
              type="submit" disabled={pending}
              className="w-full py-4 rounded-xl font-bold text-white text-sm gradient-animated hover:opacity-90 disabled:opacity-50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create account
                  <span>→</span>
                </span>
              )}
            </button>
          </div>
        </form>
      </div>

      <p className="text-center text-sm text-slate-500 mt-6 animate-fade-up delay-600" style={{animationFillMode:'forwards'}}>
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
