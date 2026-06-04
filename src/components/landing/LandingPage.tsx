'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

/* ── Particle background ─────────────────────────────────────────── */
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string }[] = []
    const colors = ['#6366f1','#8b5cf6','#ec4899','#06b6d4','#a78bfa']

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
        vx:    (Math.random() - 0.5) * 0.4,
        vy:    (Math.random() - 0.5) * 0.4,
        r:     Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
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
        ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2,'0')
        ctx.fill()
      }

      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(99,102,241,${0.15 * (1 - dist / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

/* ── Floating orbs ───────────────────────────────────────────────── */
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] animate-float" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[100px] animate-float2" />
      <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-pink-600/10 blur-[80px] animate-float" style={{animationDelay:'3s'}} />
    </div>
  )
}

/* ── Typing animation ────────────────────────────────────────────── */
function TypedText({ words }: { words: string[] }) {
  const [idx, setIdx]   = useState(0)
  const [text, setText] = useState('')
  const [del, setDel]   = useState(false)

  useEffect(() => {
    const word = words[idx]
    let timeout: NodeJS.Timeout

    if (!del && text.length < word.length) {
      timeout = setTimeout(() => setText(word.slice(0, text.length + 1)), 80)
    } else if (!del && text.length === word.length) {
      timeout = setTimeout(() => setDel(true), 2000)
    } else if (del && text.length > 0) {
      timeout = setTimeout(() => setText(text.slice(0, -1)), 40)
    } else if (del && text.length === 0) {
      setDel(false)
      setIdx(i => (i + 1) % words.length)
    }

    return () => clearTimeout(timeout)
  }, [text, del, idx, words])

  return (
    <span className="text-gradient">
      {text}
      <span className="inline-block w-0.5 h-10 bg-indigo-400 ml-1 animate-[blink_1s_ease-in-out_infinite]" />
    </span>
  )
}

/* ── Feature card ────────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: string }) {
  return (
    <div
      className="opacity-0-init animate-fade-up glass rounded-2xl p-6 card-hover group cursor-default"
      style={{ animationDelay: delay, animationFillMode: 'forwards' }}
    >
      <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="font-semibold text-white text-base mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

/* ── Stat counter ────────────────────────────────────────────────── */
function StatCard({ number, label, suffix = '' }: { number: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0
        const step = number / 60
        const timer = setInterval(() => {
          start += step
          if (start >= number) { setCount(number); clearInterval(timer) }
          else setCount(Math.floor(start))
        }, 16)
        obs.disconnect()
      }
    })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [number])

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl font-black text-white">
        {count}{suffix}
      </p>
      <p className="text-slate-400 text-sm mt-1">{label}</p>
    </div>
  )
}

/* ── Code preview ────────────────────────────────────────────────── */
const CODE = `{
  "name": "My CRM",
  "resources": [{
    "name": "contacts",
    "fields": [
      { "name": "email",  "type": "email" },
      { "name": "status", "type": "select",
        "options": ["lead","customer"] }
    ]
  }],
  "pages": [{
    "path": "/contacts",
    "components": [{
      "type": "table",
      "resource": "contacts"
    }]
  }]
}`

function CodePreview() {
  const lines = CODE.split('\n')
  return (
    <div className="glass-dark rounded-2xl overflow-hidden shadow-2xl">
      {/* window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <span className="ml-3 text-xs text-slate-400 font-mono">app.config.json</span>
      </div>
      <pre className="p-5 text-xs font-mono overflow-x-auto">
        {lines.map((line, i) => (
          <div key={i} className="leading-6">
            <span className="text-slate-600 select-none mr-4 text-[10px]">{String(i + 1).padStart(2, ' ')}</span>
            <span className={
              line.includes('"name"') || line.includes('"type"') || line.includes('"fields"') ||
              line.includes('"pages"') || line.includes('"resources"') || line.includes('"options"') ||
              line.includes('"path"') || line.includes('"components"') || line.includes('"resource"')
                ? 'text-indigo-400'
                : line.includes('"email"') || line.includes('"select"') || line.includes('"table"') ||
                  line.includes('"contacts"') || line.includes('"lead"') || line.includes('"customer"') ||
                  line.includes('"My CRM"') || line.includes('"/contacts"')
                  ? 'text-emerald-400'
                  : 'text-slate-300'
            }>
              {line}
            </span>
          </div>
        ))}
      </pre>
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [showCta, setShowCta] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowCta(true), 400)
    return () => clearTimeout(t)
  }, [])

  const features = [
    { icon: '⚡', title: 'Instant Runtime', desc: 'JSON config renders a full app instantly — no redeployment, no rebuild cycle.' },
    { icon: '🗄️', title: 'Dynamic DB', desc: 'PostgreSQL + Prisma. CRUD APIs auto-generated from your resource definitions.' },
    { icon: '🎨', title: 'UI Renderer', desc: '10 component types: table, form, kanban, chart, calendar, stat and more.' },
    { icon: '⚙️', title: 'Workflow Engine', desc: 'Event-driven automations — record triggers, conditions, webhooks, emails.' },
    { icon: '📥', title: 'CSV Import', desc: 'Upload → map columns → bulk insert with per-row error reporting.' },
    { icon: '🐙', title: 'GitHub Export', desc: 'One click to generate a real Next.js repo and push it to GitHub.' },
    { icon: '🌍', title: 'Multi-language', desc: 'Built-in EN, FR, DE, ES. Locale strings served from a dedicated API.' },
    { icon: '🔐', title: 'Auth & Roles', desc: 'JWT sessions, bcrypt passwords, role-based access per resource and page.' },
  ]

  return (
    <div className="min-h-screen bg-[#060612] text-white overflow-x-hidden">
      <FloatingOrbs />
      <Particles />

      {/* ── NAV ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-2 animate-fade-in">
          <div className="w-8 h-8 gradient-animated rounded-lg flex items-center justify-center text-white font-black text-sm">A</div>
          <span className="font-bold text-white text-lg tracking-tight">AppGen</span>
        </div>
        <div className="flex items-center gap-4 animate-fade-in delay-200">
          <Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">Sign in</Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg gradient-animated hover:opacity-90 transition-opacity"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-32">
        {/* pill badge */}
        <div className="opacity-0-init animate-fade-up delay-100 mb-6 inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs text-slate-300" style={{animationFillMode:'forwards'}}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Metadata-driven · Zero code generation · Always live
        </div>

        <h1 className="opacity-0-init animate-fade-up delay-200 text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-4" style={{animationFillMode:'forwards'}}>
          Build apps from
          <br />
          <TypedText words={['JSON config','a single file','pure metadata','your vision']} />
        </h1>

        <p className="opacity-0-init animate-fade-up delay-300 max-w-xl text-slate-400 text-lg leading-relaxed mb-10" style={{animationFillMode:'forwards'}}>
          Describe your app once. The engine renders the UI, registers APIs,
          manages your database, and runs workflows — all at runtime.
        </p>

        {showCta && (
          <div className="opacity-0-init animate-scale-in flex flex-col sm:flex-row items-center gap-4" style={{animationFillMode:'forwards'}}>
            <Link
              href="/register"
              className="group relative px-8 py-4 gradient-animated rounded-xl font-bold text-white text-base overflow-hidden animate-pulse-glow hover:scale-105 transition-transform duration-300"
            >
              <span className="relative z-10">Start building for free →</span>
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 glass rounded-xl font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300 text-base"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* scroll indicator */}
        <div className="mt-20 flex flex-col items-center gap-2 text-slate-500 text-xs animate-bounce-soft">
          <span>Scroll to explore</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── CODE PREVIEW ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="opacity-0-init animate-slide-left delay-200" style={{animationFillMode:'forwards'}}>
            <p className="text-indigo-400 font-semibold text-sm uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-5">
              One JSON file.<br />
              <span className="text-gradient">A complete app.</span>
            </h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              Define resources, pages, workflows, auth and i18n in a single config.
              The runtime interprets it live — every change takes effect instantly.
            </p>
            <ul className="space-y-3">
              {[
                ['✦', 'Resources → REST APIs + database tables'],
                ['✦', 'Pages → rendered UI with 10 component types'],
                ['✦', 'Workflows → event-driven automations'],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-start gap-3 text-slate-300 text-sm">
                  <span className="text-indigo-400 mt-0.5 shrink-0">{icon}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="opacity-0-init animate-slide-right delay-300" style={{animationFillMode:'forwards'}}>
            <CodePreview />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 py-16 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard number={10}  suffix="+"  label="Component types" />
          <StatCard number={4}         label="Languages built-in" />
          <StatCard number={7}         label="Workflow step types" />
          <StatCard number={100} suffix="%" label="TypeScript" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-indigo-400 font-semibold text-sm uppercase tracking-widest mb-3">Everything included</p>
          <h2 className="text-3xl md:text-5xl font-black text-white">
            A full stack in <span className="text-gradient">one config</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <FeatureCard
              key={f.title}
              {...f}
              delay={`${0.1 + i * 0.08}s`}
            />
          ))}
        </div>
      </section>

      {/* ── COMPONENT SHOWCASE ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white">
            10 UI components, <span className="text-gradient">zero code</span>
          </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {['Table','Form','Kanban','Chart','Calendar','Stat','Card','Tabs','Modal','Detail'].map((c, i) => (
            <div
              key={c}
              className="opacity-0-init animate-fade-up glass px-5 py-2.5 rounded-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-default card-hover"
              style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'forwards' }}
            >
              {c}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-32">
        <div className="gradient-animated rounded-3xl p-px">
          <div className="bg-[#0d0d1f] rounded-3xl p-10 md:p-16 text-center">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              Ready to build?
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto">
              Create your account and launch your first app in under 5 minutes.
            </p>
            <Link
              href="/register"
              className="inline-block px-10 py-4 gradient-animated rounded-xl font-bold text-white text-lg hover:scale-105 transition-transform duration-300 animate-pulse-glow"
            >
              Create free account →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 gradient-animated rounded-md flex items-center justify-center text-white font-black text-xs">A</div>
            <span className="text-slate-500 text-sm">AI App Generator</span>
          </div>
          <p className="text-slate-600 text-xs">
            MIT License · Built by{' '}
            <a href="https://github.com/aanyaagrawal26" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Aanya Agrawal
            </a>
          </p>
          <div className="flex items-center gap-5 text-slate-500 text-sm">
            <Link href="/login"    className="hover:text-white transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            <a href="https://github.com/aanyaagrawal26/ai-app-generator" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
