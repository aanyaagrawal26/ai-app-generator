'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register } from '@/lib/auth/actions'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined)

  const fields = [
    { id:'name',     label:'Full name',     icon:'👤', type:'text',     auto:'name',         ph:'Jane Smith' },
    { id:'email',    label:'Email address', icon:'✉',  type:'email',    auto:'email',        ph:'you@example.com' },
    { id:'password', label:'Password',      icon:'🔒', type:'password', auto:'new-password', ph:'Min 8 characters' },
  ] as const

  return (
    <div className="animate-modal">
      <div className="text-center mb-8 animate-fade-up">
        <div className="relative inline-block mb-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl animate-pulse-pink mx-auto" style={{background:'linear-gradient(135deg,#ec4899,#8b5cf6,#6366f1)'}}>
            ✨
          </div>
          <div className="absolute inset-0 rounded-2xl animate-ping-slow opacity-25" style={{background:'linear-gradient(135deg,#ec4899,#6366f1)'}} />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Create account</h1>
        <p className="text-slate-400 text-sm mt-1.5">Build apps from JSON — free forever</p>
      </div>

      <div className="glass rounded-3xl p-8 shadow-2xl animate-fade-up delay-100" style={{animationFillMode:'both'}}>
        {state?.errors?.general && (
          <div className="mb-5 flex items-start gap-3 rounded-xl p-3.5 text-sm animate-scale-in"
            style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.25)'}}>
            <span className="text-red-400 shrink-0">⚠</span>
            <span className="text-red-300">{state.errors.general.join(', ')}</span>
          </div>
        )}

        <form action={action} className="space-y-5">
          {fields.map((f, i) => {
            const err = state?.errors?.[f.id as keyof NonNullable<typeof state.errors>]
            return (
              <div key={f.id} className="animate-fade-up opacity-0-init" style={{animationDelay:`${.15+i*.08}s`,animationFillMode:'both'}}>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{f.label}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{f.icon}</span>
                  <input id={f.id} name={f.id} type={f.type} autoComplete={f.auto} required
                    suppressHydrationWarning
                    className="w-full pl-11 pr-4 py-3.5 text-sm text-white rounded-xl placeholder-slate-600 transition-all duration-300 focus:ring-2 focus:ring-indigo-500/50"
                    style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)'}}
                    placeholder={f.ph} />
                </div>
                {err && <p className="text-red-400 text-xs mt-1.5">{(err as string[]).join(', ')}</p>}
              </div>
            )
          })}

          <div className="animate-fade-up delay-400 pt-1" style={{animationFillMode:'both'}}>
            <button type="submit" disabled={pending}
              className="relative w-full py-3.5 rounded-xl font-black text-white text-sm overflow-hidden disabled:opacity-50 hover:scale-[1.02] active:scale-[.98] transition-transform duration-200 shadow-xl beam-effect"
              style={{background:'linear-gradient(135deg,#ec4899,#8b5cf6,#6366f1)'}}>
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

      <p className="text-center text-sm text-slate-500 mt-6 animate-fade-up delay-500" style={{animationFillMode:'both'}}>
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Sign in</Link>
      </p>
    </div>
  )
}
