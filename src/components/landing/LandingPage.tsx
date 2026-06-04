'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

/* ── Canvas Particle System ──────────────────────────────────────── */
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    interface Particle {
      x: number; y: number; vx: number; vy: number
      r: number; alpha: number; color: string
    }
    const particles: Particle[] = []
    const colors = ['#6366f1','#8b5cf6','#ec4899','#06b6d4','#a78bfa','#f59e0b']

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 80; i++) {
      particles.push({
        x:     Math.random() * window.innerWidth,
        y:     Math.random() * window.innerHeight,
        vx:    (Math.random() - 0.5) * 0.45,
        vy:    (Math.random() - 0.5) * 0.45,
        r:     Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.55 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        const hex = Math.floor(p.alpha * 255).toString(16).padStart(2, '0')
        ctx.fillStyle = p.color + hex
        ctx.fill()
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 110) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(99,102,241,${0.18 * (1 - dist / 110)})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

/* ── Floating Orbs ───────────────────────────────────────────────── */
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-600/20 blur-[140px] animate-float" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px] animate-float2" />
      <div className="absolute top-[40%] left-[50%] w-[350px] h-[350px] rounded-full bg-pink-600/15 blur-[90px] animate-float" style={{animationDelay:'3s'}} />
      <div className="absolute top-[20%] right-[20%] w-[200px] h-[200px] rounded-full bg-cyan-500/10 blur-[60px] animate-float3" style={{animationDelay:'1.5s'}} />
      <div className="absolute bottom-[30%] left-[20%] w-[250px] h-[250px] rounded-full bg-violet-500/10 blur-[70px] animate-float2" style={{animationDelay:'4s'}} />
    </div>
  )
}

/* ── Typewriter ──────────────────────────────────────────────────── */
function TypedText({ words }: { words: string[] }) {
  const [idx, setIdx]   = useState(0)
  const [text, setText] = useState('')
  const [del, setDel]   = useState(false)

  useEffect(() => {
    const word = words[idx]
    let t: ReturnType<typeof setTimeout>

    if (!del && text.length < word.length) {
      t = setTimeout(() => setText(word.slice(0, text.length + 1)), 75)
    } else if (!del && text.length === word.length) {
      t = setTimeout(() => setDel(true), 2200)
    } else if (del && text.length > 0) {
      t = setTimeout(() => setText(text.slice(0, -1)), 38)
    } else if (del && text.length === 0) {
      setDel(false)
      setIdx(i => (i + 1) % words.length)
    }
    return () => clearTimeout(t)
  }, [text, del, idx, words])

  return (
    <span className="text-gradient">
      {text}
      <span className="inline-block w-[3px] h-[0.85em] bg-indigo-400 ml-1 align-middle animate-[blink_1s_ease-in-out_infinite]" />
    </span>
  )
}

/* ── Animated stat counter ───────────────────────────────────────── */
function StatCard({ number, label, suffix = '' }: { number: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      let start = 0
      const step = number / 60
      const timer = setInterval(() => {
        start += step
        if (start >= number) { setCount(number); clearInterval(timer) }
        else setCount(Math.floor(start))
      }, 16)
      obs.disconnect()
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [number])

  return (
    <div ref={ref} className="text-center group">
      <div className="relative inline-block">
        <p className="text-5xl md:text-6xl font-black text-white tabular-nums tracking-tight">
          {count}<span className="text-gradient">{suffix}</span>
        </p>
        <div className="absolute inset-0 blur-2xl opacity-0 group-hover:opacity-30 transition-opacity"
          style={{background:'linear-gradient(135deg,#6366f1,#ec4899)'}} />
      </div>
      <p className="text-slate-400 text-sm mt-2 font-medium">{label}</p>
    </div>
  )
}

/* ── Feature card ────────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay, color }: {
  icon: string; title: string; desc: string; delay: string; color: string
}) {
  return (
    <div
      className="opacity-0-init animate-fade-up rounded-2xl p-6 card-hover group cursor-default relative overflow-hidden"
      style={{
        animationDelay: delay,
        animationFillMode: 'forwards',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{background:`radial-gradient(circle at 50% 0%, ${color}15, transparent 70%)`}} />

      <div className="relative z-10">
        <div
          className="text-2xl mb-4 w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{background:`${color}20`, border:`1px solid ${color}30`}}
        >
          {icon}
        </div>
        <h3 className="font-bold text-white text-sm mb-2 group-hover:text-gradient transition-all">{title}</h3>
        <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

/* ── Code Preview ────────────────────────────────────────────────── */
const CODE_LINES = [
  { text: '{', cls: 'text-slate-300' },
  { text: '  "name": "My CRM",', cls: '' },
  { text: '  "resources": [{', cls: '' },
  { text: '    "name": "contacts",', cls: '' },
  { text: '    "fields": [', cls: '' },
  { text: '      { "name": "email",', cls: '' },
  { text: '        "type": "email" },', cls: '' },
  { text: '      { "name": "status",', cls: '' },
  { text: '        "type": "select",', cls: '' },
  { text: '        "options": ["lead","active"] }', cls: '' },
  { text: '    ]', cls: 'text-slate-300' },
  { text: '  }],', cls: 'text-slate-300' },
  { text: '  "pages": [{', cls: '' },
  { text: '    "path": "/contacts",', cls: '' },
  { text: '    "components": [{', cls: '' },
  { text: '      "type": "table",', cls: '' },
  { text: '      "resource": "contacts"', cls: '' },
  { text: '    }]', cls: 'text-slate-300' },
  { text: '  }]', cls: 'text-slate-300' },
  { text: '}', cls: 'text-slate-300' },
]

const KEYS = new Set(['"name"','"type"','"fields"','"pages"','"resources"','"options"','"path"','"components"','"resource"'])
const VALS = new Set(['"email"','"select"','"table"','"contacts"','"lead"','"active"','"My CRM"','"/contacts"','"status"'])

function colorLine(raw: string): React.ReactNode {
  const tokens = raw.split(/(\"[^\"]*\")/g)
  return tokens.map((tok, i) => {
    if (KEYS.has(tok)) return <span key={i} className="text-violet-400">{tok}</span>
    if (VALS.has(tok)) return <span key={i} className="text-emerald-400">{tok}</span>
    if (tok.startsWith('"')) return <span key={i} className="text-yellow-300">{tok}</span>
    return <span key={i} className="text-slate-400">{tok}</span>
  })
}

function CodePreview() {
  return (
    <div className="glass-dark rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8" style={{background:'rgba(255,255,255,0.04)'}}>
        <div className="w-3 h-3 rounded-full bg-red-400/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
        <div className="w-3 h-3 rounded-full bg-green-400/80" />
        <span className="ml-3 text-xs text-slate-500 font-mono">app.config.json</span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400">live</span>
        </span>
      </div>
      <pre className="p-5 text-xs font-mono overflow-x-auto leading-6">
        {CODE_LINES.map((line, i) => (
          <div key={i}>
            <span className="text-slate-700 select-none mr-3 text-[10px] tabular-nums">{String(i + 1).padStart(2, ' ')}</span>
            {colorLine(line.text)}
          </div>
        ))}
      </pre>
    </div>
  )
}

/* ── Component pills ─────────────────────────────────────────────── */
const COMPONENTS = [
  { name: 'Table', color: '#6366f1' },
  { name: 'Form', color: '#ec4899' },
  { name: 'Kanban', color: '#8b5cf6' },
  { name: 'Chart', color: '#06b6d4' },
  { name: 'Calendar', color: '#f59e0b' },
  { name: 'Stat', color: '#10b981' },
  { name: 'Card', color: '#6366f1' },
  { name: 'Tabs', color: '#ec4899' },
  { name: 'Modal', color: '#8b5cf6' },
  { name: 'Detail', color: '#06b6d4' },
]

/* ── Main LandingPage ────────────────────────────────────────────── */
export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t) }, [])

  const features = [
    { icon: '⚡', title: 'Instant Runtime',   desc: 'JSON config renders a full app — no redeployment, no rebuild cycle ever.',                color: '#6366f1' },
    { icon: '🗄️', title: 'Dynamic Database',  desc: 'SQLite + Prisma. CRUD APIs auto-generated from your resource definitions.',               color: '#8b5cf6' },
    { icon: '🎨', title: '10 UI Components',  desc: 'Table, form, kanban, chart, calendar, stat, card, tabs, modal, detail. Zero code.',       color: '#ec4899' },
    { icon: '⚙️', title: 'Workflow Engine',   desc: 'Event-driven automations — record triggers, conditions, webhooks, email steps.',          color: '#06b6d4' },
    { icon: '📥', title: 'CSV Import',        desc: 'Upload CSV → map columns → bulk-insert with per-row error reporting.',                    color: '#f59e0b' },
    { icon: '🐙', title: 'GitHub Export',     desc: 'One click to generate a real Next.js repo and push it directly to GitHub.',               color: '#10b981' },
    { icon: '🌍', title: 'Multi-language',    desc: 'Built-in EN, FR, DE, ES. Locale strings served from a dedicated i18n API.',               color: '#a78bfa' },
    { icon: '🔐', title: 'Auth & Roles',      desc: 'JWT sessions, bcrypt passwords, role-based access per resource and page.',                color: '#f43f5e' },
  ]

  return (
    <div className="min-h-screen bg-[#060612] text-white overflow-x-hidden">
      <FloatingOrbs />
      <Particles />

      {/* ── NAV ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-14 py-5">
        <div className="flex items-center gap-2.5 animate-fade-in" style={{animationFillMode:'forwards'}}>
          <div className="w-9 h-9 gradient-animated rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg animate-pulse-glow">
            A
          </div>
          <span className="font-bold text-white text-lg tracking-tight">AppGen</span>
        </div>
        <div className="hidden md:flex items-center gap-8 animate-fade-in delay-100" style={{animationFillMode:'forwards'}}>
          <a href="#features" className="text-slate-400 hover:text-white text-sm transition-colors">Features</a>
          <a href="#how-it-works" className="text-slate-400 hover:text-white text-sm transition-colors">How it works</a>
          <a href="#components" className="text-slate-400 hover:text-white text-sm transition-colors">Components</a>
        </div>
        <div className="flex items-center gap-3 animate-fade-in delay-200" style={{animationFillMode:'forwards'}}>
          <Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors font-medium hidden sm:block">
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 text-sm font-bold text-white rounded-xl gradient-animated hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-36">
        {/* badge */}
        <div
          className="opacity-0-init animate-fade-up delay-100 mb-8 inline-flex items-center gap-2.5 glass rounded-full px-5 py-2.5 text-xs font-medium text-slate-300"
          style={{animationFillMode:'forwards'}}
        >
          <span className="text-indigo-400">✦</span>
          Now in Beta &nbsp;·&nbsp; Zero code generation &nbsp;·&nbsp; Always live
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
        </div>

        <h1
          className="opacity-0-init animate-fade-up delay-200 text-5xl md:text-7xl lg:text-8xl font-black leading-[1.02] tracking-tight mb-5"
          style={{animationFillMode:'forwards'}}
        >
          Build full-stack apps<br />
          from{' '}
          <TypedText words={['JSON config', 'a single file', 'pure metadata', 'your vision']} />
        </h1>

        <p
          className="opacity-0-init animate-fade-up delay-300 max-w-2xl text-slate-400 text-lg md:text-xl leading-relaxed mb-12"
          style={{animationFillMode:'forwards'}}
        >
          Describe your app once in a JSON config. The engine renders the UI, registers REST APIs,
          manages your database, and runs workflows — all at runtime, no code generation.
        </p>

        {mounted && (
          <div className="opacity-0-init animate-scale-in flex flex-col sm:flex-row items-center gap-4" style={{animationFillMode:'forwards'}}>
            <Link
              href="/register"
              className="group relative px-9 py-4 gradient-animated rounded-2xl font-bold text-white text-base overflow-hidden animate-pulse-glow hover:scale-105 transition-transform duration-300 shadow-2xl"
            >
              <span className="relative z-10">Start building free →</span>
            </Link>
            <Link
              href="/login"
              className="px-9 py-4 glass rounded-2xl font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300 text-base"
            >
              Watch demo
            </Link>
          </div>
        )}

        {/* scroll indicator */}
        <div className="mt-24 flex flex-col items-center gap-2 text-slate-600 text-xs animate-bounce-soft">
          <span className="tracking-wider uppercase text-[10px]">Scroll to explore</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 py-20 border-y border-white/5" style={{background:'rgba(255,255,255,0.015)'}}>
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          <StatCard number={10}  suffix="+"  label="Component types" />
          <StatCard number={4}              label="Languages built-in" />
          <StatCard number={7}              label="Workflow step types" />
          <StatCard number={100} suffix="%" label="TypeScript" />
        </div>
      </section>

      {/* ── HOW IT WORKS / CODE PREVIEW ── */}
      <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-6 py-28">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div className="opacity-0-init animate-slide-left delay-100" style={{animationFillMode:'forwards'}}>
            <span className="inline-block text-indigo-400 font-semibold text-xs uppercase tracking-widest mb-4 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10">
              How it works
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              One JSON file.<br />
              <span className="text-gradient">A complete app.</span>
            </h2>
            <p className="text-slate-400 leading-relaxed mb-8 text-base">
              Define resources, pages, workflows, auth, and i18n in a single config file.
              The runtime interprets it live — every change takes effect instantly without
              any rebuilds.
            </p>
            <ul className="space-y-4">
              {[
                { icon: '🗄️', text: 'Resources → REST APIs + database tables' },
                { icon: '📄', text: 'Pages → rendered UI with 10 component types' },
                { icon: '⚡', text: 'Workflows → event-driven automations' },
                { icon: '🔐', text: 'Auth → JWT sessions, bcrypt, role access' },
              ].map(item => (
                <li key={item.text} className="flex items-center gap-3 text-slate-300 text-sm">
                  <span className="text-base w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
                    style={{background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.25)'}}>
                    {item.icon}
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="opacity-0-init animate-slide-right delay-200" style={{animationFillMode:'forwards'}}>
            <CodePreview />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="inline-block text-indigo-400 font-semibold text-xs uppercase tracking-widest mb-4 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10">
            Everything included
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white">
            A full stack in <span className="text-gradient">one config</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              title={f.title}
              desc={f.desc}
              color={f.color}
              delay={`${0.05 + i * 0.07}s`}
            />
          ))}
        </div>
      </section>

      {/* ── COMPONENT SHOWCASE ── */}
      <section id="components" className="relative z-10 max-w-5xl mx-auto px-6 pb-28">
        <div className="text-center mb-14">
          <span className="inline-block text-pink-400 font-semibold text-xs uppercase tracking-widest mb-4 px-3 py-1 rounded-full border border-pink-500/30 bg-pink-500/10">
            UI library
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            10 components, <span className="text-gradient">zero code</span>
          </h2>
          <p className="text-slate-400 mt-4 max-w-lg mx-auto">
            Declare a component type in your config. The renderer handles everything else.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {COMPONENTS.map((c, i) => (
            <div
              key={c.name}
              className="opacity-0-init animate-fade-up glass px-6 py-3 rounded-full text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-default group relative overflow-hidden"
              style={{ animationDelay: `${i * 0.06}s`, animationFillMode: 'forwards', border:`1px solid ${c.color}22` }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full pointer-events-none"
                style={{background:`radial-gradient(ellipse at center, ${c.color}18, transparent 70%)`}} />
              <span className="relative z-10">{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-36">
        <div className="relative rounded-3xl p-px animate-glow-border" style={{background:'linear-gradient(135deg,#6366f1,#ec4899,#06b6d4)'}}>
          <div className="rounded-3xl p-12 md:p-20 text-center relative overflow-hidden" style={{background:'#0d0f24'}}>
            {/* inner glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{background:'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15), transparent 60%)'}} />
            <div className="relative z-10">
              <div className="text-5xl mb-6">🚀</div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight">
                Ready to build?
              </h2>
              <p className="text-slate-400 text-lg mb-12 max-w-lg mx-auto leading-relaxed">
                Create your account and launch your first app in under 5 minutes.
                No credit card, no setup, no code.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="px-10 py-4 gradient-animated rounded-2xl font-bold text-white text-lg hover:scale-105 transition-transform duration-300 animate-pulse-glow shadow-2xl"
                >
                  Create free account →
                </Link>
                <Link
                  href="/login"
                  className="px-10 py-4 glass rounded-2xl font-semibold text-slate-300 hover:text-white transition-all text-lg"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 gradient-animated rounded-lg flex items-center justify-center text-white font-black text-xs">A</div>
            <span className="text-slate-400 text-sm font-medium">AI App Generator</span>
          </div>

          <p className="text-slate-600 text-xs text-center">
            MIT License · Built by{' '}
            <a href="https://github.com/aanyaagrawal26" target="_blank" rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Aanya Agrawal
            </a>
            {' '}· Open source on{' '}
            <a href="https://github.com/aanyaagrawal26/ai-app-generator" target="_blank" rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors">
              GitHub
            </a>
          </p>

          <div className="flex items-center gap-6 text-slate-500 text-sm">
            <Link href="/login"    className="hover:text-white transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            <a href="#features"    className="hover:text-white transition-colors">Features</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
