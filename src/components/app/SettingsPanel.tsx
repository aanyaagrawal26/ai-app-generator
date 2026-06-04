'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AppConfig } from '@/lib/config/schema'

interface Props {
  appId: string
  appName: string
  appDescription: string
  isPublished: boolean
  config: AppConfig
  configJson: string
}

export default function SettingsPanel({ appId, appName, appDescription, isPublished, config, configJson }: Props) {
  const router = useRouter()
  const [name, setName] = useState(appName)
  const [description, setDescription] = useState(appDescription)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, startDelete] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  function handleSave() {
    startTransition(async () => {
      setSaveError('')
      setSaved(false)
      const res = await fetch(`/api/apps/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setSaveError(data?.error?.message ?? 'Failed to save changes')
      }
    })
  }

  function handleExportConfig() {
    const blob = new Blob([configJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${appName.replace(/\s+/g, '-').toLowerCase()}-config.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDelete() {
    if (deleteConfirm !== appName) {
      setDeleteError(`Type "${appName}" to confirm`)
      return
    }
    setDeleteError('')
    startDelete(async () => {
      const res = await fetch(`/api/apps/${appId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard')
      } else {
        setDeleteError('Failed to delete app')
      }
    })
  }

  const section = 'rounded-2xl p-6 border border-white/7'
  const sectionBg = { background: 'rgba(255,255,255,0.03)' }

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up" style={{animationFillMode:'forwards'}}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/apps/${appId}`} className="text-slate-500 hover:text-white text-sm transition-colors">
              ← {appName}
            </Link>
          </div>
          <h1 className="text-2xl font-black text-white">Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your app configuration and preferences.</p>
        </div>
        <div className="text-3xl opacity-60">🎛️</div>
      </div>

      {/* General settings */}
      <div className={`${section} animate-fade-up delay-100`} style={{...sectionBg, animationFillMode:'forwards'}}>
        <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
            style={{background:'rgba(99,102,241,0.2)'}}>⚙️</span>
          General
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              App Name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm transition-all duration-200"
              style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}
              onFocus={e => { e.currentTarget.style.border='1px solid rgba(99,102,241,0.6)'; e.currentTarget.style.background='rgba(99,102,241,0.05)' }}
              onBlur={e  => { e.currentTarget.style.border='1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.background='rgba(255,255,255,0.05)' }}
              placeholder="My App"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm transition-all duration-200 resize-none"
              style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}
              onFocus={e => { e.currentTarget.style.border='1px solid rgba(99,102,241,0.6)'; e.currentTarget.style.background='rgba(99,102,241,0.05)' }}
              onBlur={e  => { e.currentTarget.style.border='1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.background='rgba(255,255,255,0.05)' }}
              placeholder="What does this app do?"
            />
          </div>

          {saveError && (
            <p className="text-red-400 text-xs flex items-center gap-1">⚠ {saveError}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={isPending || (!name.trim())}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105 disabled:opacity-50"
              style={{background:'linear-gradient(135deg, #6366f1, #ec4899)'}}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : 'Save changes'}
            </button>
            {saved && (
              <span className="text-emerald-400 text-xs font-medium flex items-center gap-1 animate-fade-in">
                ✓ Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Theme preview */}
      <div className={`${section} animate-fade-up delay-200`} style={{...sectionBg, animationFillMode:'forwards'}}>
        <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
            style={{background:'rgba(236,72,153,0.2)'}}>🎨</span>
          Theme
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Primary color</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg shadow-lg" style={{background:config.theme.primaryColor}} />
              <span className="text-sm font-mono text-slate-300">{config.theme.primaryColor}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Font family</p>
            <span className="text-sm text-slate-300" style={{fontFamily:config.theme.fontFamily}}>
              {config.theme.fontFamily}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Border radius</p>
            <span className="text-sm text-slate-300 capitalize">{config.theme.borderRadius}</span>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Status</p>
            <span className={`text-sm font-medium ${isPublished ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isPublished ? '● Live' : '○ Draft'}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-4">
          Edit the theme in your{' '}
          <Link href={`/apps/${appId}/config`} className="text-indigo-400 hover:text-indigo-300">config file →</Link>
        </p>
      </div>

      {/* Export config */}
      <div className={`${section} animate-fade-up delay-300`} style={{...sectionBg, animationFillMode:'forwards'}}>
        <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
            style={{background:'rgba(6,182,212,0.2)'}}>📤</span>
          Export Config
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Download your full app configuration as a JSON file. Use it as a backup or to recreate this app elsewhere.
        </p>
        <button
          onClick={handleExportConfig}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
          style={{background:'rgba(6,182,212,0.15)', border:'1px solid rgba(6,182,212,0.25)'}}
        >
          <span>⬇</span> Download config.json
        </button>
      </div>

      {/* Danger zone */}
      <div
        className={`${section} animate-fade-up delay-400`}
        style={{background:'rgba(239,68,68,0.04)', border:'1px solid rgba(239,68,68,0.2)', animationFillMode:'forwards'}}
      >
        <h2 className="text-sm font-bold text-red-400 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs bg-red-500/20">⚠️</span>
          Danger Zone
        </h2>

        {!showDeleteDialog ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Delete this app</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Permanently removes the app, all its records, and import history.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-red-400 transition-all hover:bg-red-500/15"
              style={{border:'1px solid rgba(239,68,68,0.3)'}}
            >
              Delete app
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-scale-in" style={{animationFillMode:'forwards'}}>
            <div className="rounded-xl p-3.5" style={{background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)'}}>
              <p className="text-sm text-red-300 font-medium">
                ⚠ This action is <strong>irreversible</strong>. All records and data will be permanently deleted.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Type <span className="text-red-400 font-mono">{appName}</span> to confirm
              </label>
              <input
                value={deleteConfirm}
                onChange={e => { setDeleteConfirm(e.target.value); setDeleteError('') }}
                className="w-full text-white placeholder-slate-700 rounded-xl px-4 py-3 text-sm"
                style={{background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.25)'}}
                placeholder={appName}
              />
              {deleteError && <p className="text-red-400 text-xs mt-1.5">{deleteError}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting…
                  </span>
                ) : 'Permanently delete'}
              </button>
              <button
                onClick={() => { setShowDeleteDialog(false); setDeleteConfirm(''); setDeleteError('') }}
                className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
