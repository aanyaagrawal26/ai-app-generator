'use client'

import { useState, useRef, useTransition, useCallback } from 'react'
import type { Resource } from '@/lib/config/schema'
import Link from 'next/link'

interface Props {
  appId:     string
  resources: Resource[]
}

type Step = 'upload' | 'mapping' | 'processing' | 'done'

interface JobStatus {
  id:            string
  status:        string
  totalRows:     number
  processedRows: number
  failedRows:    number
  errors?:       Array<{ row: number; message: string }>
}

const STEP_LABELS: Record<Step, string> = {
  upload:     'Upload',
  mapping:    'Map columns',
  processing: 'Importing',
  done:       'Done',
}
const STEP_ICONS: Record<Step, string> = {
  upload:     '📁',
  mapping:    '🔀',
  processing: '⚙️',
  done:       '✅',
}
const STEPS: Step[] = ['upload', 'mapping', 'processing', 'done']

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.indexOf(current)
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => {
        const done    = i < currentIdx
        const active  = s === current
        const future  = i > currentIdx
        return (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold transition-all duration-300 ${
                  done   ? 'text-white scale-100'   :
                  active ? 'text-white scale-110 animate-pulse-glow' :
                  'text-slate-600'
                }`}
                style={{
                  background: done   ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' :
                               active ? 'linear-gradient(135deg, #6366f1, #ec4899)' :
                               'rgba(255,255,255,0.05)',
                  border: future ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  boxShadow: active ? '0 0 20px rgba(99,102,241,0.4)' : 'none',
                }}
              >
                {done ? '✓' : STEP_ICONS[s]}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap transition-colors ${
                active ? 'text-white' : done ? 'text-indigo-400' : 'text-slate-600'
              }`}>
                {STEP_LABELS[s]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-12 h-0.5 mb-4 mx-1 transition-all duration-500"
                style={{background: i < currentIdx ? 'linear-gradient(90deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.07)'}}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function CSVImport({ appId, resources }: Props) {
  const [step,              setStep]              = useState<Step>('upload')
  const [selectedResource,  setSelectedResource]  = useState(resources[0]?.name ?? '')
  const [csvText,           setCsvText]           = useState('')
  const [headers,           setHeaders]           = useState<string[]>([])
  const [mapping,           setMapping]           = useState<Record<string, string>>({})
  const [fileName,          setFileName]          = useState('')
  const [job,               setJob]               = useState<JobStatus | null>(null)
  const [error,             setError]             = useState('')
  const [isDragging,        setIsDragging]        = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  const resource = resources.find(r => r.name === selectedResource)

  function processFile(file: File) {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setCsvText(text)
      const firstLine = text.split('\n')[0] ?? ''
      const cols = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      setHeaders(cols)
      const auto: Record<string, string> = {}
      if (resource) {
        for (const col of cols) {
          const match = resource.fields.find(f =>
            f.name.toLowerCase() === col.toLowerCase() ||
            (f.label ?? '').toLowerCase() === col.toLowerCase()
          )
          if (match) auto[col] = match.name
        }
      }
      setMapping(auto)
      setStep('mapping')
    }
    reader.readAsText(file)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) processFile(file)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource])

  async function startImport() {
    setError('')
    startTransition(async () => {
      try {
        const res = await fetch('/api/import', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ appId, resourceName: selectedResource, fileName, csvData: csvText, columnMappings: mapping }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error?.message ?? 'Failed to create import job'); return }

        const procRes = await fetch(`/api/import/${data.id}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ columnMappings: mapping }),
        })
        if (!procRes.ok) { setError('Failed to start processing'); return }

        setJob({ id: data.id, status: 'PROCESSING', totalRows: 0, processedRows: 0, failedRows: 0 })
        setStep('processing')
        pollJob(data.id)
      } catch {
        setError('Network error — please try again.')
      }
    })
  }

  function pollJob(jobId: string) {
    const interval = setInterval(async () => {
      const res  = await fetch(`/api/import/${jobId}`)
      const data = await res.json() as JobStatus
      setJob(data)
      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        clearInterval(interval)
        setStep('done')
      }
    }, 1500)
  }

  function reset() {
    setStep('upload'); setCsvText(''); setHeaders([])
    setMapping({}); setJob(null); setError(''); setFileName('')
  }

  const mappedCount = Object.values(mapping).filter(Boolean).length
  const progressPct = job?.totalRows ? Math.round((job.processedRows / job.totalRows) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div className="animate-fade-up" style={{animationFillMode:'forwards'}}>
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/apps/${appId}`} className="text-slate-500 hover:text-white text-sm transition-colors">
            ← Back to app
          </Link>
        </div>
        <h1 className="text-2xl font-black text-white">CSV Import</h1>
        <p className="text-slate-400 text-sm mt-1">Upload a CSV to bulk-import records into any resource.</p>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center animate-fade-up delay-100" style={{animationFillMode:'forwards'}}>
        <StepIndicator current={step} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl p-3.5 flex items-start gap-3 animate-scale-in text-sm"
          style={{background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', animationFillMode:'forwards'}}>
          <span className="text-red-400 shrink-0">⚠</span>
          <span className="text-red-300">{error}</span>
        </div>
      )}

      {/* Card */}
      <div className="rounded-3xl overflow-hidden animate-fade-up delay-200"
        style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', animationFillMode:'forwards'}}>

        {/* ── Step 1: Upload ── */}
        {step === 'upload' && (
          <div className="p-7 space-y-5">
            {/* Resource select */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Target resource
              </label>
              <div className="relative">
                <select
                  value={selectedResource}
                  onChange={e => setSelectedResource(e.target.value)}
                  className="w-full text-white rounded-xl px-4 py-3 text-sm appearance-none cursor-pointer transition-all"
                  style={{background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)'}}
                >
                  {resources.map(r => (
                    <option key={r.name} value={r.name} style={{background:'#0d0f24'}}>
                      {r.label ?? r.name}
                    </option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▾</span>
              </div>
            </div>

            {/* Drop zone */}
            <div
              className={`relative rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
                isDragging ? 'scale-[1.02]' : ''
              }`}
              style={{
                border: isDragging
                  ? '2px dashed rgba(99,102,241,0.7)'
                  : '2px dashed rgba(255,255,255,0.12)',
                background: isDragging
                  ? 'rgba(99,102,241,0.06)'
                  : 'rgba(255,255,255,0.02)',
              }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {isDragging ? (
                <>
                  <div className="text-4xl mb-3 animate-bounce-soft">📁</div>
                  <p className="font-bold text-indigo-300">Drop it here!</p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4">📄</div>
                  <p className="font-semibold text-white text-sm mb-1">Drop a CSV file or click to browse</p>
                  <p className="text-xs text-slate-500">First row must contain column headers</p>
                  <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-indigo-300 transition-all"
                    style={{background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)'}}>
                    Choose file →
                  </div>
                </>
              )}
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </div>
          </div>
        )}

        {/* ── Step 2: Column mapping ── */}
        {step === 'mapping' && resource && (
          <div className="p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Map CSV columns</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  File: <span className="font-mono text-slate-400">{fileName}</span> ·{' '}
                  {headers.length} columns detected
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium text-emerald-300"
                style={{background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.2)'}}>
                {mappedCount} / {headers.length} mapped
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {headers.map((col, i) => {
                const isMapped = !!mapping[col]
                return (
                  <div
                    key={col}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{
                      background: isMapped ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isMapped ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      animationDelay:`${i*0.03}s`,
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono text-slate-300 truncate">{col}</p>
                    </div>
                    <div className="text-slate-600 shrink-0">
                      {isMapped ? (
                        <span className="text-indigo-400 text-base">→</span>
                      ) : (
                        <span className="text-slate-700 text-base">⇢</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <select
                        value={mapping[col] ?? ''}
                        onChange={e => setMapping(m => ({ ...m, [col]: e.target.value }))}
                        className="w-full text-xs text-white rounded-lg px-3 py-2 appearance-none cursor-pointer"
                        style={{background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)'}}
                      >
                        <option value="" style={{background:'#0d0f24'}}>— skip column —</option>
                        {resource.fields.map(f => (
                          <option key={f.name} value={f.name} style={{background:'#0d0f24'}}>
                            {f.label ?? f.name} ({f.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
                style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)'}}
              >
                ← Back
              </button>
              <button
                onClick={startImport}
                disabled={isPending || mappedCount === 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02] disabled:opacity-40"
                style={{background:'linear-gradient(135deg, #6366f1, #ec4899)'}}
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Starting…
                  </span>
                ) : `Start import (${mappedCount} column${mappedCount !== 1 ? 's' : ''})`}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Processing ── */}
        {step === 'processing' && job && (
          <div className="p-10 text-center space-y-6">
            <div className="relative inline-block">
              <div className="text-6xl animate-spin-slow">⚙️</div>
              <div className="absolute inset-0 rounded-full blur-xl opacity-30 pointer-events-none animate-pulse"
                style={{background:'#6366f1'}} />
            </div>
            <div>
              <p className="font-black text-white text-lg">Importing records…</p>
              <p className="text-slate-400 text-sm mt-1">Please keep this page open.</p>
            </div>
            {job.totalRows > 0 ? (
              <div className="space-y-3 max-w-sm mx-auto">
                <div className="h-2.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPct}%`,
                      background: 'linear-gradient(90deg, #6366f1, #ec4899)',
                      boxShadow: '0 0 12px rgba(99,102,241,0.5)',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{job.processedRows} / {job.totalRows} rows</span>
                  <span className="font-bold text-white">{progressPct}%</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                    style={{animationDelay:`${i * 0.15}s`}} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === 'done' && job && (
          <div className="p-8 space-y-5">
            <div className="text-center py-4">
              <div className={`text-6xl mb-4 ${job.status === 'COMPLETED' ? '' : ''}`}>
                {job.status === 'COMPLETED' ? '🎉' : '❌'}
              </div>
              <h3 className={`text-xl font-black ${job.status === 'COMPLETED' ? 'text-white' : 'text-red-300'}`}>
                {job.status === 'COMPLETED' ? 'Import complete!' : 'Import failed'}
              </h3>
              <div className="flex items-center justify-center gap-5 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-black text-emerald-400 tabular-nums">{job.processedRows}</p>
                  <p className="text-xs text-slate-500 mt-0.5">imported</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <p className={`text-2xl font-black tabular-nums ${job.failedRows > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                    {job.failedRows}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">failed</p>
                </div>
              </div>
            </div>

            {(job.errors ?? []).length > 0 && (
              <div className="rounded-xl p-4 max-h-36 overflow-y-auto"
                style={{background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)'}}>
                <p className="text-xs font-bold text-red-400 mb-2">Row errors:</p>
                {(job.errors ?? []).map(e => (
                  <p key={e.row} className="text-xs font-mono text-red-300/70">
                    Row {e.row}: {e.message}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)'}}
              >
                Import another file
              </button>
              <Link
                href={`/apps/${appId}/records`}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white text-center transition-all hover:opacity-90"
                style={{background:'linear-gradient(135deg, #6366f1, #ec4899)'}}
              >
                View records →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
