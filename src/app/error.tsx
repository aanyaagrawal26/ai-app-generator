'use client'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#060612] flex items-center justify-center">
      <div className="text-center max-w-md">
        <p className="text-5xl mb-4">💥</p>
        <h1 className="text-xl font-bold text-white">Something went wrong</h1>
        <p className="text-slate-400 text-sm mt-2 font-mono">{error.message}</p>
        <button onClick={reset} className="mt-6 px-5 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-all"
          style={{background:'linear-gradient(135deg,#6366f1,#ec4899)'}}>
          Try again
        </button>
      </div>
    </div>
  )
}
