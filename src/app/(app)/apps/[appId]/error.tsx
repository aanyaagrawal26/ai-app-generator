'use client'

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-4xl mb-4">💥</p>
      <h2 className="text-xl font-semibold text-gray-800">Something went wrong</h2>
      <p className="text-gray-400 text-sm mt-2 font-mono max-w-sm">{error.message}</p>
      <button
        onClick={reset}
        className="mt-6 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg"
      >
        Try again
      </button>
    </div>
  )
}
