interface Props {
  user: { name?: string | null; email: string; role: string }
}

export default function TopBar({ user }: Props) {
  const initials = (user.name ?? user.email).slice(0, 2).toUpperCase()
  return (
    <header className="h-14 flex items-center justify-between px-6 shrink-0 border-b border-white/5"
      style={{ background: 'rgba(7,9,26,0.8)', backdropFilter: 'blur(20px)' }}>
      <div />
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 capitalize px-2 py-1 rounded-full border border-white/10">{user.role}</span>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
          {initials}
        </div>
        <span className="text-sm text-slate-300 hidden sm:block">{user.name ?? user.email}</span>
      </div>
    </header>
  )
}
