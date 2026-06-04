'use client'

import { useState, useRef, useTransition } from 'react'
import type { Resource } from '@/lib/config/schema'

interface Props {
  appId:     string
  resources: Resource[]
}

type Step = 'upload' | 'mapping' | 'processing' | 'done'

interface JobStatus {
  id:           string
  status:       string
  totalRows:    number
  processedRows: number
  failedRows:   number
  errors?:      Array<{ row: number; message: string }>
}

export default function CSVImport({ appId, resources }: Props) {
  const [step,            setStep]           = useState<Step>('upload')
  const [selectedResource, setSelectedResource] = useState(resources[0]?.name ?? '')
  const [csvText,         setCsvText]        = useState('')
  const [headers,         setHeaders]        = useState<string[]>([])
  const [mapping,         setMapping]        = useState<Record<string, string>>({})
  const [fileName,        setFileName]       = useState('')
  const [job,             setJob]            = useState<JobStatus | null>(null)
  const [error,           setError]          = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  const resource = resources.find(r => r.name === selectedResource)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setCsvText(text)
      const firstLine = text.split('\n')[0] ?? ''
      const cols = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      setHeaders(cols)
      // Auto-map matching names
      const auto: Record<string, string> = {}
      if (resource) {
        for (const col of cols) {
          const match = resource.fields.find(f =>
            f.name.toLowerCase() === col.toLowerCase() || (f.label ?? '').toLowerCase() === col.toLowerCase()
          )
          if (match) auto[col] = match.name
        }
      }
      setMapping(auto)
      setStep('mapping')
    }
    reader.readAsText(file)
  }

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

        // Kick off processing
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import CSV</h1>
        <p className="text-gray-500 text-sm mt-1">Upload a CSV file to bulk-import records into any resource.</p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2 text-xs">
        {(['upload','mapping','processing','done'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
              step === s ? 'bg-indigo-600 text-white' :
              ['upload','mapping','processing','done'].indexOf(step) > i ? 'bg-indigo-200 text-indigo-700' :
              'bg-gray-100 text-gray-400'
            }`}>{i + 1}</div>
            <span className={step === s ? 'text-indigo-700 font-medium' : 'text-gray-400'}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
            {i < 3 && <span className="text-gray-200">—</span>}
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Resource</label>
              <select
                value={selectedResource}
                onChange={e => setSelectedResource(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              >
                {resources.map(r => <option key={r.name} value={r.name}>{r.label ?? r.name}</option>)}
              </select>
            </div>
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <div className="text-4xl mb-3">📄</div>
              <p className="font-medium text-gray-700">Click to upload a CSV file</p>
              <p className="text-xs text-gray-400 mt-1">First row must be column headers</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </div>
          </div>
        )}

        {/* Step 2: Column mapping */}
        {step === 'mapping' && resource && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Map CSV columns → resource fields</h3>
              <p className="text-xs text-gray-400">File: <span className="font-mono">{fileName}</span> · {headers.length} columns detected</p>
            </div>
            <div className="space-y-2">
              {headers.map(col => (
                <div key={col} className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gray-600 w-44 truncate">{col}</span>
                  <span className="text-gray-300">→</span>
                  <select
                    value={mapping[col] ?? ''}
                    onChange={e => setMapping(m => ({ ...m, [col]: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  >
                    <option value="">— skip —</option>
                    {resource.fields.map(f => <option key={f.name} value={f.name}>{f.label ?? f.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep('upload')} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Back</button>
              <button
                onClick={startImport} disabled={isPending || Object.values(mapping).filter(Boolean).length === 0}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isPending ? 'Starting…' : 'Start Import'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && job && (
          <div className="text-center space-y-4 py-6">
            <div className="text-4xl animate-pulse">⏳</div>
            <p className="font-medium text-gray-700">Importing records…</p>
            {job.totalRows > 0 && (
              <>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-indigo-500 h-3 rounded-full transition-all"
                    style={{ width: `${Math.round((job.processedRows / job.totalRows) * 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500">{job.processedRows} / {job.totalRows} rows</p>
              </>
            )}
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && job && (
          <div className="space-y-4">
            <div className={`text-center py-6 ${job.status === 'COMPLETED' ? '' : 'text-red-600'}`}>
              <div className="text-4xl mb-3">{job.status === 'COMPLETED' ? '✅' : '❌'}</div>
              <p className="font-semibold text-gray-900">
                {job.status === 'COMPLETED' ? 'Import complete' : 'Import failed'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {job.processedRows} imported · {job.failedRows} failed
              </p>
            </div>

            {(job.errors ?? []).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                <p className="text-xs font-semibold text-red-700 mb-1">Row errors:</p>
                {(job.errors ?? []).map(e => (
                  <p key={e.row} className="text-xs font-mono text-red-600">Row {e.row}: {e.message}</p>
                ))}
              </div>
            )}

            <button
              onClick={() => { setStep('upload'); setCsvText(''); setHeaders([]); setMapping({}); setJob(null) }}
              className="w-full py-2 border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 font-medium rounded-lg transition-colors"
            >
              Import Another File
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
