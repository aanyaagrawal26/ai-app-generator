import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#060612] flex items-center justify-center">
      <div className="text-center">
        <p className="text-7xl font-black text-gradient mb-4">404</p>
        <h1 className="text-2xl font-bold text-white">Page not found</h1>
        <p className="text-slate-400 mt-2 text-sm">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/dashboard" className="mt-8 inline-block px-6 py-3 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-all"
          style={{background:'linear-gradient(135deg,#6366f1,#ec4899)'}}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
