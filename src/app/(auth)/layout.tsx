export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#060612] flex items-center justify-center p-4 overflow-hidden relative">
      {/* animated orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] animate-float pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[100px] animate-float2 pointer-events-none" />
      <div className="fixed top-[40%] right-[30%] w-[200px] h-[200px] rounded-full bg-pink-600/10 blur-[60px] animate-float pointer-events-none" style={{animationDelay:'2s'}} />

      {/* grid lines */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{backgroundImage:'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize:'60px 60px'}}
      />

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  )
}
