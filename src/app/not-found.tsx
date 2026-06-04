import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-indigo-600">404</p>
        <h1 className="text-2xl font-semibold text-gray-900 mt-4">Page not found</h1>
        <p className="text-gray-500 mt-2">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/dashboard" className="mt-6 inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
