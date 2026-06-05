export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#05050f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Orbs */}
      <div className="fixed top-[-30%] left-[-15%] w-[70vw] h-[70vw] rounded-full blur-[160px] pointer-events-none animate-orb-pulse" style={{background:'radial-gradient(circle,rgba(99,102,241,.22),transparent 70%)'}} />
      <div className="fixed bottom-[-30%] right-[-15%] w-[60vw] h-[60vw] rounded-full blur-[140px] pointer-events-none animate-orb-pulse" style={{background:'radial-gradient(circle,rgba(236,72,153,.18),transparent 70%)',animationDelay:'2s'}} />
      <div className="fixed top-[40%] right-[20%] w-[30vw] h-[30vw] rounded-full blur-[100px] pointer-events-none animate-float3" style={{background:'radial-gradient(circle,rgba(6,182,212,.1),transparent 70%)',animationDelay:'1s'}} />

      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[.025]" style={{backgroundImage:'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',backgroundSize:'60px 60px'}} />

      {/* Floating particles (CSS only) */}
      {[...Array(12)].map((_,i) => (
        <div key={i} className="fixed w-1 h-1 rounded-full pointer-events-none animate-float"
          style={{
            left:`${10+i*7}%`, top:`${15+((i*31)%70)}%`,
            background:['#6366f1','#ec4899','#8b5cf6','#06b6d4'][i%4],
            opacity:.3+((i%3)*.15),
            animationDuration:`${5+i*0.8}s`,
            animationDelay:`${i*0.4}s`,
          }} />
      ))}

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}
