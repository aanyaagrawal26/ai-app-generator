'use client'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <p className="text-5xl mb-4">💥</p>
        <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
        <p className="text-gray-500 text-sm mt-2 font-mono">{error.message}</p>
        <button onClick={reset} className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          Try again
        </button>
      </div>
    </div>
  )
}
