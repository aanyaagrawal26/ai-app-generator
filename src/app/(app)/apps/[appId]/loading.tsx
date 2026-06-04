export default function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex gap-2 items-center text-gray-400 text-sm">
        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        Loading…
      </div>
    </div>
  )
}
