interface Props {
  user: { name?: string | null; email: string; role: string }
}

export default function TopBar({ user }: Props) {
  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 capitalize">{user.role}</span>
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
          {(user.name ?? user.email).charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-gray-700 hidden sm:block">{user.name ?? user.email}</span>
      </div>
    </header>
  )
}
