export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060612] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-600/20 blur-[140px] animate-float pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px] animate-float2 pointer-events-none" />
      <div className="fixed top-[30%] right-[25%] w-[250px] h-[250px] rounded-full bg-pink-600/12 blur-[70px] animate-float3 pointer-events-none" style={{animationDelay:'2s'}} />
      <div className="fixed bottom-[25%] left-[20%] w-[200px] h-[200px] rounded-full bg-cyan-500/8 blur-[60px] animate-float pointer-events-none" style={{animationDelay:'4s'}} />

      {/* grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* radial vignette */}
      <div className="fixed inset-0 pointer-events-none"
        style={{background:'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08), transparent 60%)'}} />

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}
