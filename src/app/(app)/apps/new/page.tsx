'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Sparkles, Users, KanbanSquare, Boxes, ArrowLeft, ArrowRight, Check,
  CircleCheck, CircleAlert, Loader2, Wand2, type LucideIcon,
} from 'lucide-react'
import { TEMPLATES, type Template } from '@/lib/templates'

const ICONS: Record<string, LucideIcon> = { Sparkles, Users, KanbanSquare, Boxes }

const STEPS = ['Template', 'Details', 'Review'] as const

export default function NewAppPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [step, setStep] = useState(0)
  const [tpl, setTpl] = useState<Template | null>(null)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [json, setJson] = useState('')
  const [generating, setGenerating] = useState(false)

  // live JSON validity for the review step
  const jsonState = useMemo(() => {
    if (!json.trim()) return { ok: true as const, empty: true }
    try { JSON.parse(json); return { ok: true as const, empty: false } }
    catch (e) { return { ok: false as const, error: (e as Error).message } }
  }, [json])

  function pickTemplate(t: Template) {
    setTpl(t)
    setName(t.config?.name as string ?? '')
    setDesc(t.config?.description as string ?? '')
    setJson(t.config ? JSON.stringify(t.config, null, 2) : '')
    setStep(1)
  }

  function submit() {
    if (!name.trim()) { toast.error('Please give your app a name'); return }
    let config: Record<string, unknown> | undefined
    if (json.trim()) {
      try { config = JSON.parse(json) } catch { toast.error('Invalid JSON syntax'); setStep(2); return }
    }
    if (config) { config.id = crypto.randomUUID(); config.name = name; config.description = desc || undefined }

    setGenerating(true)
    startTransition(async () => {
      try {
        const res = await fetch('/api/apps', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description: desc, config }),
        })
        const d = await res.json()
        if (!res.ok) throw new Error(d.error?.message ?? 'Failed to create app')
        toast.success(`${name} is ready 🚀`)
        // brief beat so the success animation reads, then route
        setTimeout(() => router.push(`/apps/${d.id}`), 650)
      } catch (err) {
        setGenerating(false)
        toast.error(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  if (generating) return <GeneratingState name={name} />

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header + stepper */}
      <div className="mb-8 animate-fade-up" style={{ animationFillMode: 'forwards' }}>
        <h1 className="text-2xl font-black text-fg flex items-center gap-2.5">
          <Wand2 size={22} className="text-indigo-400" /> Create a new app
        </h1>
        <p className="text-fg-muted text-sm mt-1.5">Pick a starting point, name it, and generate your runtime.</p>
        <Stepper step={step} />
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <Slide key="t">
            <div className="grid sm:grid-cols-2 gap-4">
              {TEMPLATES.map((t, i) => {
                const Icon = ICONS[t.icon] ?? Sparkles
                return (
                  <motion.button
                    key={t.key}
                    onClick={() => pickTemplate(t)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -4 }}
                    className="group text-left rounded-2xl p-5 surface-card surface-card-hover transition-colors relative overflow-hidden"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{ background: `radial-gradient(circle at 50% 0%, ${t.accent}18, transparent 70%)` }} />
                    <div className="relative z-10">
                      <div className="w-11 h-11 rounded-xl grid place-items-center mb-4 transition-transform group-hover:scale-110"
                        style={{ background: `${t.accent}1f`, border: `1px solid ${t.accent}33`, color: t.accent }}>
                        <Icon size={20} />
                      </div>
                      <h3 className="font-bold text-fg text-sm">{t.name}</h3>
                      <p className="text-fg-faint text-xs mt-1 leading-relaxed">{t.tagline}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {t.highlights.map(h => (
                          <span key={h} className="text-[10px] font-medium px-2 py-0.5 rounded-full text-fg-muted"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>{h}</span>
                        ))}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </Slide>
        )}

        {step === 1 && (
          <Slide key="d">
            <div className="rounded-2xl surface-card p-6 space-y-5">
              <Field label="App name" required>
                <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="My CRM"
                  className="input-base" />
              </Field>
              <Field label="Description">
                <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What does this app do?"
                  className="input-base" />
              </Field>
              {tpl && (
                <p className="text-xs text-fg-faint flex items-center gap-1.5">
                  <Check size={13} className="text-emerald-400" /> Starting from the <span className="text-fg-muted font-medium">{tpl.name}</span> template
                </p>
              )}
            </div>
            <NavRow
              onBack={() => setStep(0)}
              onNext={() => { if (!name.trim()) { toast.error('Please give your app a name'); return } setStep(2) }}
              nextLabel="Review config"
            />
          </Slide>
        )}

        {step === 2 && (
          <Slide key="r">
            <div className="rounded-2xl surface-card p-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-fg-muted uppercase tracking-wider">JSON config</label>
                <span className={`flex items-center gap-1.5 text-xs font-medium ${jsonState.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {jsonState.ok
                    ? <><CircleCheck size={14} /> {jsonState.empty ? 'Blank app' : 'Valid JSON'}</>
                    : <><CircleAlert size={14} /> Invalid JSON</>}
                </span>
              </div>
              <textarea value={json} onChange={e => setJson(e.target.value)} rows={16} spellCheck={false}
                className="w-full bg-[var(--surface)] border border-edge text-fg-muted placeholder-[var(--fg-faint)] rounded-xl px-4 py-3 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-[var(--ring)] transition-all resize-none leading-6"
                placeholder={'{\n  "name": "My App",\n  "resources": [],\n  "pages": []\n}'} />
              <p className="text-xs text-fg-faint">Leave empty to start blank. The runtime validates this on creation.</p>
            </div>
            <NavRow
              onBack={() => setStep(1)}
              onNext={submit}
              nextLabel={isPending ? 'Generating…' : 'Generate app'}
              nextIcon={<Sparkles size={16} />}
              disabled={!jsonState.ok || isPending}
            />
          </Slide>
        )}
      </AnimatePresence>

      <style>{`.input-base{width:100%;background:var(--surface);border:1px solid var(--border);color:var(--fg);border-radius:.75rem;padding:.75rem 1rem;font-size:.875rem;outline:none;transition:all .2s}.input-base::placeholder{color:var(--fg-faint)}.input-base:focus{border-color:#6366f1;box-shadow:0 0 0 2px var(--ring)}`}</style>
    </div>
  )
}

/* ── pieces ─────────────────────────────────────────────────────────── */

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mt-6">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            i < step ? 'text-emerald-400' : i === step ? 'text-fg' : 'text-fg-faint'
          }`}
            style={i === step ? { background: 'linear-gradient(135deg, rgba(99,102,241,.2), rgba(236,72,153,.1))', border: '1px solid rgba(99,102,241,.3)' } : { border: '1px solid var(--border)' }}>
            <span className={`w-4 h-4 grid place-items-center rounded-full text-[10px] ${i < step ? 'bg-emerald-500/20' : ''}`}>
              {i < step ? <Check size={11} /> : i + 1}
            </span>
            {label}
          </div>
          {i < STEPS.length - 1 && <div className="w-6 h-px bg-[var(--border)]" />}
        </div>
      ))}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">
        {label}{required && <span className="text-rose-400"> *</span>}
      </label>
      {children}
    </div>
  )
}

function NavRow({ onBack, onNext, nextLabel, nextIcon, disabled }: {
  onBack: () => void; onNext: () => void; nextLabel: string; nextIcon?: React.ReactNode; disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between mt-5">
      <button onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-fg-muted hover:text-fg rounded-xl hover:bg-[var(--surface-hover)] transition-colors">
        <ArrowLeft size={16} /> Back
      </button>
      <button onClick={onNext} disabled={disabled}
        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg"
        style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
        {nextLabel} {nextIcon ?? <ArrowRight size={16} />}
      </button>
    </div>
  )
}

function GeneratingState({ name }: { name: string }) {
  return (
    <div className="max-w-md mx-auto flex flex-col items-center justify-center text-center py-28">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-20 h-20 grid place-items-center rounded-2xl mb-8"
        style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
        <span className="absolute inset-0 rounded-2xl animate-pulse-glow" />
        <Loader2 size={34} className="text-white animate-spin" />
      </motion.div>
      <h2 className="text-xl font-black text-fg">Generating {name || 'your app'}…</h2>
      <p className="text-fg-muted text-sm mt-2">Provisioning resources, APIs and the runtime.</p>
      <div className="mt-8 w-full space-y-2.5">
        {['Validating config', 'Creating database tables', 'Registering REST APIs', 'Booting the runtime'].map((s, i) => (
          <motion.div key={s}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.35 }}
            className="flex items-center gap-3 text-sm text-fg-muted">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.45 + i * 0.35 }}>
              <CircleCheck size={16} className="text-emerald-400" />
            </motion.span>
            {s}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
