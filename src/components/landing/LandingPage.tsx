'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

/* ══════════════════════════════════════════════════
   CANVAS PARTICLE NETWORK
══════════════════════════════════════════════════ */
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let raf: number
    const COLORS = ['#6366f1','#8b5cf6','#ec4899','#06b6d4','#a78bfa','#f472b6']

    interface P { x:number;y:number;vx:number;vy:number;r:number;c:string;a:number }
    let pts: P[] = []

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      pts = Array.from({ length: 90 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - .5) * .5,
        vy: (Math.random() - .5) * .5,
        r: Math.random() * 2 + .5,
        c: COLORS[~~(Math.random() * COLORS.length)],
        a: Math.random() * .6 + .15,
      }))
    }
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', e => { mouse.current = { x: e.clientX, y: e.clientY } })

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const W = canvas.width, H = canvas.height

      for (const p of pts) {
        // mouse repulsion
        const dx = p.x - mouse.current.x, dy = p.y - mouse.current.y
        const d2 = dx*dx + dy*dy
        if (d2 < 14400) { const f = (120 - Math.sqrt(d2)) / 120 * .015; p.vx += dx * f; p.vy += dy * f }
        p.vx = Math.max(-1.2, Math.min(1.2, p.vx))
        p.vy = Math.max(-1.2, Math.min(1.2, p.vy))
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2)
        ctx.fillStyle = p.c + Math.floor(p.a * 255).toString(16).padStart(2,'0')
        ctx.fill()
      }

      for (let i = 0; i < pts.length; i++) {
        for (let j = i+1; j < pts.length; j++) {
          const dx = pts[i].x-pts[j].x, dy = pts[i].y-pts[j].y
          const dist = Math.sqrt(dx*dx+dy*dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(99,102,241,${.16*(1-dist/120)})`
            ctx.lineWidth = .7
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={ref} className="fixed inset-0 z-0 pointer-events-none" />
}

/* ══════════════════════════════════════════════════
   AURORA ORBS
══════════════════════════════════════════════════ */
function Orbs() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute -top-1/4 -left-1/4 w-[80vw] h-[80vw] rounded-full blur-[160px] animate-orb-pulse" style={{background:'radial-gradient(circle,rgba(99,102,241,.22),transparent 70%)'}} />
      <div className="absolute -bottom-1/4 -right-1/4 w-[70vw] h-[70vw] rounded-full blur-[140px] animate-orb-pulse" style={{background:'radial-gradient(circle,rgba(236,72,153,.18),transparent 70%)', animationDelay:'2.5s'}} />
      <div className="absolute top-1/3 left-1/2 w-[40vw] h-[40vw] rounded-full blur-[100px] animate-float3" style={{background:'radial-gradient(circle,rgba(6,182,212,.12),transparent 70%)', animationDelay:'1s'}} />
      <div className="absolute top-1/4 right-1/4 w-[25vw] h-[25vw] rounded-full blur-[80px] animate-float2" style={{background:'radial-gradient(circle,rgba(139,92,246,.15),transparent 70%)', animationDelay:'3.5s'}} />
    </div>
  )
}

/* ══════════════════════════════════════════════════
   TYPEWRITER
══════════════════════════════════════════════════ */
const WORDS = ['JSON config', 'a single file', 'pure metadata', 'zero code', 'your vision']

function Typewriter() {
  const [wordIdx, setWordIdx] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = WORDS[wordIdx]
    const speed = deleting ? 35 : 80
    const t = setTimeout(() => {
      if (!deleting && text.length < word.length) setText(word.slice(0, text.length + 1))
      else if (!deleting && text.length === word.length) setTimeout(() => setDeleting(true), 2000)
      else if (deleting && text.length > 0) setText(text.slice(0, -1))
      else { setDeleting(false); setWordIdx(i => (i + 1) % WORDS.length) }
    }, speed)
    return () => clearTimeout(t)
  }, [text, deleting, wordIdx])

  return (
    <span className="text-gradient">
      {text}
      <span className="inline-block w-[3px] h-[.85em] ml-1 align-middle" style={{background:'linear-gradient(#818cf8,#f472b6)', animation:'typing-cursor 1s ease-in-out infinite'}} />
    </span>
  )
}

/* ══════════════════════════════════════════════════
   ANIMATED COUNTER
══════════════════════════════════════════════════ */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [n, setN] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      let s = 0
      const step = target / 50
      const t = setInterval(() => {
        s += step; if (s >= target) { setN(target); clearInterval(t) } else setN(Math.floor(s))
      }, 20)
      obs.disconnect()
    }, { threshold: .4 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{n}{suffix}</span>
}

/* ══════════════════════════════════════════════════
   FLOATING TECH TAGS (marquee)
══════════════════════════════════════════════════ */
const TECHS = ['Next.js 16','React 19','TypeScript','TailwindCSS 4','Prisma','SQLite','Zod v4','JWT Auth','REST API','Workflow Engine','CSV Import','GitHub Export','i18n','CRUD','Dynamic UI']

function TechMarquee() {
  return (
    <div className="relative overflow-hidden py-4" style={{maskImage:'linear-gradient(90deg,transparent,black 10%,black 90%,transparent)'}}>
      <div className="flex gap-3 animate-marquee whitespace-nowrap">
        {[...TECHS, ...TECHS].map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 shrink-0" style={{background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)'}}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-70" />{t}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   FEATURE CARD
══════════════════════════════════════════════════ */
function FeatureCard({ icon, title, desc, color, delay }: { icon:string; title:string; desc:string; color:string; delay:string }) {
  return (
    <div
      className="group relative rounded-2xl p-6 cursor-default card-hover opacity-0-init animate-fade-up overflow-hidden"
      style={{ animationDelay: delay, background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.07)' }}
    >
      {/* per-card glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{background:`radial-gradient(circle at 50% 0%,${color}18,transparent 65%)`}} />
      {/* beam sweep */}
      <div className="absolute top-0 left-0 w-1/3 h-full opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{background:`linear-gradient(90deg,transparent,${color}12,transparent)`, transition:'opacity .3s', animation:'beam 1.8s ease-in-out'}} />

      <div className="relative z-10">
        <div className="text-3xl mb-4 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
          style={{background:`${color}20`,border:`1px solid ${color}30`}}>
          {icon}
        </div>
        <h3 className="font-bold text-white text-sm mb-2 leading-snug">{title}</h3>
        <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   CODE EDITOR PREVIEW
══════════════════════════════════════════════════ */
const CODE = `{
  "name": "My CRM",
  "resources": [{
    "name": "contacts",
    "fields": [
      { "name": "email",  "type": "email"  },
      { "name": "status", "type": "select",
        "options": ["lead","active","won"] }
    ]
  }],
  "pages": [{
    "path": "/contacts",
    "components": [{
      "type": "table",
      "resource": "contacts",
      "config": { "searchable": true }
    }]
  }],
  "workflows": [{
    "trigger": "record.created",
    "steps": [{ "type": "send_email" }]
  }]
}`

const KEYS = new Set(['"name"','"type"','"fields"','"pages"','"resources"','"options"','"path"','"components"','"resource"','"config"','"searchable"','"workflows"','"trigger"','"steps"'])
const VALS = new Set(['"email"','"select"','"table"','"contacts"','"lead"','"active"','"won"','"My CRM"','"/contacts"','"record.created"','"send_email"'])

function colorLine(raw: string): React.ReactNode {
  return raw.split(/(\"[^\"]*\"|true|false|\d+)/g).map((tok, i) => {
    if (KEYS.has(tok)) return <span key={i} className="text-violet-400">{tok}</span>
    if (VALS.has(tok)) return <span key={i} className="text-emerald-400">{tok}</span>
    if (tok === 'true' || tok === 'false') return <span key={i} className="text-orange-400">{tok}</span>
    if (/^\d+$/.test(tok)) return <span key={i} className="text-yellow-400">{tok}</span>
    if (tok.startsWith('"')) return <span key={i} className="text-sky-300">{tok}</span>
    return <span key={i} className="text-slate-500">{tok}</span>
  })
}

function CodeEditor() {
  const lines = CODE.split('\n')
  return (
    <div className="glass-dark rounded-2xl overflow-hidden relative group">
      {/* title bar */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/8" style={{background:'rgba(255,255,255,.03)'}}>
        <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-pointer" />
        <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors cursor-pointer" />
        <span className="ml-4 text-xs font-mono text-slate-500">app.config.json</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-medium">live</span>
        </div>
      </div>
      {/* code */}
      <pre className="p-5 text-[11px] font-mono leading-[1.7] overflow-x-auto">
        {lines.map((line, i) => (
          <div key={i} className="hover:bg-white/3 rounded transition-colors px-1 -mx-1">
            <span className="text-slate-700 mr-4 select-none text-[10px] tabular-nums">{String(i+1).padStart(2,' ')}</span>
            {colorLine(line)}
          </div>
        ))}
      </pre>
      {/* typing indicator */}
      <div className="px-5 pb-4 flex items-center gap-2 border-t border-white/5">
        <div className="flex gap-1">
          {[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-indigo-400" style={{animation:`bounce-soft 1s ease-in-out ${i*.2}s infinite`}} />)}
        </div>
        <span className="text-[10px] text-slate-600">AI rendering in real-time…</span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   COMPONENT SHOWCASE GRID
══════════════════════════════════════════════════ */
const COMP_TYPES = [
  { name:'Table',    icon:'📊', color:'#6366f1', desc:'Paginated, searchable data table' },
  { name:'Form',     icon:'📝', color:'#ec4899', desc:'Auto-generated from field defs' },
  { name:'Kanban',   icon:'📋', color:'#8b5cf6', desc:'Drag-ready board by any field' },
  { name:'Chart',    icon:'📈', color:'#06b6d4', desc:'Bar & pie charts from your data' },
  { name:'Calendar', icon:'📅', color:'#f59e0b', desc:'Monthly view keyed on date fields' },
  { name:'Stat',     icon:'🔢', color:'#10b981', desc:'Aggregate count / sum card' },
  { name:'Card',     icon:'🃏', color:'#a78bfa', desc:'Generic container with children' },
  { name:'Tabs',     icon:'🗂️', color:'#f43f5e', desc:'Tabbed layout wrapping components' },
  { name:'Modal',    icon:'🪟', color:'#fbbf24', desc:'Trigger button + overlay' },
  { name:'Detail',   icon:'🔍', color:'#34d399', desc:'Single-record field display' },
]

/* ══════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════ */
export default function LandingPage() {
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t) }, [])

  const features = [
    { icon:'⚡', title:'Instant runtime',      desc:'Config change → app updates live. No rebuild, no redeploy.',            color:'#6366f1' },
    { icon:'🗄️', title:'Dynamic database',     desc:'SQLite + Prisma. CRUD APIs auto-registered from resource definitions.', color:'#8b5cf6' },
    { icon:'🎨', title:'10 UI components',     desc:'Declare a type. The renderer handles table, kanban, chart and more.',   color:'#ec4899' },
    { icon:'⚙️', title:'Workflow engine',      desc:'Record triggers, conditions, webhooks, delay, email in one chain.',     color:'#06b6d4' },
    { icon:'📥', title:'CSV import pipeline',  desc:'Upload → map columns → bulk insert. Per-row error reporting.',         color:'#f59e0b' },
    { icon:'🐙', title:'GitHub export',        desc:'Generates a real Next.js repo and pushes via Octokit.',                color:'#10b981' },
    { icon:'🌍', title:'Multi-language',       desc:'EN, FR, DE, ES built-in. i18n API endpoint per locale.',               color:'#a78bfa' },
    { icon:'🔐', title:'Auth & roles',         desc:'JWT sessions, bcrypt, role-based access per resource and page.',       color:'#f43f5e' },
  ]

  return (
    <div className="min-h-screen bg-[#05050f] text-white overflow-x-hidden relative">
      <Orbs />
      <ParticleCanvas />

      {/* ── NAV ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-16 py-5 animate-fade-in">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xl gradient-animated group-hover:scale-110 transition-transform animate-pulse-glow">A</div>
          <span className="font-black text-white text-lg">AppGen</span>
        </Link>

        <div className="hidden md:flex items-center gap-7 text-sm">
          {['Features','Components','Docs'].map(t => (
            <a key={t} href={`#${t.toLowerCase()}`} className="text-slate-400 hover:text-white transition-colors font-medium">{t}</a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors hidden sm:block">Sign in</Link>
          <Link href="/register"
            className="px-5 py-2.5 text-sm font-bold text-white rounded-xl hover:scale-105 hover:opacity-90 transition-all shadow-xl beam-effect"
            style={{background:'linear-gradient(135deg,#6366f1,#ec4899)'}}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-32">
        {/* badge */}
        {ready && (
          <div className="animate-scale-in mb-8 inline-flex items-center gap-2.5 glass rounded-full px-5 py-2.5 text-xs font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 relative">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping-slow" />
            </span>
            Now in Beta &nbsp;·&nbsp; Zero code generation &nbsp;·&nbsp; Always live
          </div>
        )}

        <h1 className="animate-fade-up opacity-0-init text-[clamp(2.8rem,8vw,6.5rem)] font-black leading-[1.02] tracking-tight mb-6" style={{animationFillMode:'both'}}>
          Build full-stack apps<br />
          from{' '}
          <span className="inline-block"><Typewriter /></span>
        </h1>

        <p className="animate-fade-up opacity-0-init delay-200 max-w-2xl text-slate-400 text-xl leading-relaxed mb-12" style={{animationFillMode:'both'}}>
          One JSON config drives the UI, APIs, database and workflows —
          all at runtime, no scaffolding, no redeployment.
        </p>

        {ready && (
          <div className="animate-scale-in delay-300 flex flex-col sm:flex-row items-center gap-4 mb-20">
            <Link href="/register"
              className="group relative px-10 py-4 text-base font-black text-white rounded-2xl overflow-hidden hover:scale-105 transition-transform shadow-2xl animate-pulse-glow beam-effect"
              style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)'}}>
              Start building free →
            </Link>
            <Link href="/login"
              className="px-10 py-4 glass rounded-2xl text-base font-semibold text-slate-300 hover:text-white hover:bg-white/12 transition-all">
              Sign in
            </Link>
          </div>
        )}

        {/* Social proof strip */}
        <div className="animate-fade-up opacity-0-init delay-500 flex items-center gap-6 text-xs text-slate-500" style={{animationFillMode:'both'}}>
          {['Open source','MIT license','TypeScript 100%','No vendor lock-in'].map((t,i) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="text-indigo-400">✓</span>{t}
              {i < 3 && <span className="ml-6 w-px h-3 bg-white/10" />}
            </span>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 animate-bounce-soft flex flex-col items-center gap-1.5 text-slate-600 text-xs">
          <span className="uppercase tracking-widest text-[10px]">scroll to explore</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ══ TECH MARQUEE ══ */}
      <div className="relative z-10 mb-16">
        <TechMarquee />
      </div>

      {/* ══ STATS ══ */}
      <section className="relative z-10 py-20" style={{borderTop:'1px solid rgba(255,255,255,.05)',borderBottom:'1px solid rgba(255,255,255,.05)',background:'rgba(255,255,255,.012)'}}>
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { n:10, s:'+', l:'Component types' },
            { n:4,  s:'',  l:'Languages built-in' },
            { n:7,  s:'',  l:'Workflow step types' },
            { n:100,s:'%', l:'TypeScript codebase' },
          ].map(({n,s,l}) => (
            <div key={l} className="text-center group animate-fade-up opacity-0-init" style={{animationFillMode:'both'}}>
              <p className="text-5xl md:text-6xl font-black text-white mb-2 tabular-nums">
                <Counter target={n} suffix={s} />
              </p>
              <p className="text-slate-400 text-sm font-medium">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-slide-left opacity-0-init delay-100" style={{animationFillMode:'both'}}>
            <span className="inline-block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full" style={{background:'rgba(99,102,241,.12)',border:'1px solid rgba(99,102,241,.25)'}}>
              How it works
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-7">
              One file drives<br /><span className="text-gradient">the entire app.</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-8">
              Define resources, pages, workflows, auth and i18n in a single JSON config.
              The runtime interprets it live — every change takes effect instantly.
            </p>
            <div className="space-y-3">
              {[
                ['🗄️','#6366f1','Resources','→ REST APIs + database tables auto-created'],
                ['📄','#ec4899','Pages',    '→ rendered UI with any of 10 component types'],
                ['⚡','#8b5cf6','Workflows','→ event-driven automations with branching logic'],
                ['🔐','#06b6d4','Auth',     '→ JWT sessions + bcrypt + role-based access'],
              ].map(([ico,col,key,val]) => (
                <div key={key as string} className="flex items-start gap-4 p-3.5 rounded-xl group hover:bg-white/3 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                    style={{background:`${col}18`,border:`1px solid ${col}28`}}>{ico}</div>
                  <div>
                    <span className="text-white font-semibold text-sm">{key} </span>
                    <span className="text-slate-400 text-sm">{val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-slide-right opacity-0-init delay-200" style={{animationFillMode:'both'}}>
            <CodeEditor />
          </div>
        </div>
      </section>

      {/* ══ 8 FEATURES GRID ══ */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-28">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-pink-400 uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full" style={{background:'rgba(236,72,153,.1)',border:'1px solid rgba(236,72,153,.25)'}}>
            Everything included
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white">
            A full stack in <span className="text-gradient">one config</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f,i) => (
            <FeatureCard key={f.title} {...f} delay={`${.04+i*.07}s`} />
          ))}
        </div>
      </section>

      {/* ══ COMPONENT SHOWCASE ══ */}
      <section id="components" className="relative z-10 max-w-6xl mx-auto px-6 pb-28">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold text-cyan-400 uppercase tracking-widest mb-5 px-3 py-1.5 rounded-full" style={{background:'rgba(6,182,212,.1)',border:'1px solid rgba(6,182,212,.25)'}}>
            UI library
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            10 components, <span className="text-gradient">zero code</span>
          </h2>
          <p className="text-slate-400 max-w-md mx-auto">Declare the type in your config. The engine handles everything.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {COMP_TYPES.map((c,i) => (
            <div
              key={c.name}
              className="group p-4 rounded-2xl text-center card-hover opacity-0-init animate-fade-up cursor-default relative overflow-hidden"
              style={{animationDelay:`${i*.05}s`,animationFillMode:'both',background:'rgba(255,255,255,.03)',border:`1px solid ${c.color}18`}}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                style={{background:`radial-gradient(circle at 50% 50%,${c.color}15,transparent 70%)`}} />
              <div className="text-3xl mb-2 relative z-10 group-hover:scale-125 transition-transform duration-300">{c.icon}</div>
              <p className="text-white text-xs font-bold relative z-10">{c.name}</p>
              <p className="text-slate-600 text-[10px] mt-1 relative z-10 group-hover:text-slate-400 transition-colors">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ BIG CTA ══ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-36">
        <div className="relative rounded-3xl p-px animate-glow-border" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899,#06b6d4)'}}>
          <div className="rounded-3xl p-14 md:p-20 text-center relative overflow-hidden" style={{background:'#0e0e22'}}>
            <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse at 50% 0%,rgba(99,102,241,.18),transparent 65%)'}} />
            <div className="absolute top-4 right-8 text-2xl animate-sparkle opacity-60">✦</div>
            <div className="absolute bottom-6 left-10 text-xl animate-sparkle opacity-40" style={{animationDelay:'.8s'}}>✦</div>
            <div className="relative z-10">
              <div className="text-6xl mb-6 animate-bounce-soft inline-block">🚀</div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight">
                Ready to build?
              </h2>
              <p className="text-slate-400 text-lg mb-12 max-w-md mx-auto leading-relaxed">
                Launch your first app in under 5 minutes.<br />No credit card. No setup. No code.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register"
                  className="px-12 py-4 text-lg font-black text-white rounded-2xl hover:scale-105 transition-transform shadow-2xl animate-pulse-glow beam-effect"
                  style={{background:'linear-gradient(135deg,#6366f1,#ec4899)'}}>
                  Create free account →
                </Link>
                <Link href="/login"
                  className="px-12 py-4 glass rounded-2xl text-lg font-semibold text-slate-300 hover:text-white transition-all">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="relative z-10 px-6 py-10" style={{borderTop:'1px solid rgba(255,255,255,.05)'}}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs gradient-animated">A</div>
            <span className="text-slate-400 font-medium text-sm">AI App Generator</span>
          </div>
          <p className="text-slate-700 text-xs">
            MIT License · Built by{' '}
            <a href="https://github.com/aanyaagrawal26" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">Aanya Agrawal</a>
            {' '}·{' '}
            <a href="https://github.com/aanyaagrawal26/ai-app-generator" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">GitHub</a>
          </p>
          <div className="flex gap-6 text-slate-500 text-sm">
            <Link href="/login"    className="hover:text-white transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
