'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register } from '@/lib/auth/actions'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined)

  return (
    <div className="animate-modal">
      <div className="text-center mb-8 animate-fade-up">
        <div className="inline-flex items-center justify-center w-14 h-14 gradient-animated rounded-2xl text-white font-black text-2xl mb-4 animate-pulse-glow">
          ✨
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Create account</h1>
        <p className="text-slate-400 text-sm mt-1">Start building apps from JSON</p>
      </div>

      <div className="glass rounded-3xl p-8 shadow-2xl animate-fade-up delay-100" style={{animationFillMode:'forwards'}}>
        {state?.errors?.general && (
          <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-3 text-sm animate-scale-in">
            <span className="shrink-0">⚠️</span>
            {state.errors.general.join(', ')}
          </div>
        )}

        <form action={action} className="space-y-5">
          {[
            { id:'name',     label:'Full name',       icon:'👤', type:'text',     auto:'name',         ph:'Jane Smith',         err: state?.errors?.name },
            { id:'email',    label:'Email address',   icon:'✉',  type:'email',    auto:'email',        ph:'you@example.com',    err: state?.errors?.email },
            { id:'password', label:'Password',        icon:'🔑', type:'password', auto:'new-password', ph:'Min 8 characters',   err: state?.errors?.password },
          ].map((f, i) => (
            <div key={f.id} className={`opacity-0-init animate-fade-up delay-${(i+2)*100}`} style={{animationFillMode:'forwards'}}>
              <label htmlFor={f.id} className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{f.label}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{f.icon}</span>
                <input
                  id={f.id} name={f.id} type={f.type} autoComplete={f.auto} required
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white/8 transition-all duration-300"
                  placeholder={f.ph}
                />
              </div>
              {f.err && <p className="text-red-400 text-xs mt-1.5">{f.err.join(', ')}</p>}
            </div>
          ))}

          <div className="opacity-0-init animate-fade-up delay-500 pt-1" style={{animationFillMode:'forwards'}}>
            <button
              type="submit" disabled={pending}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm gradient-animated hover:opacity-90 disabled:opacity-50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              {pending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create account →'}
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
