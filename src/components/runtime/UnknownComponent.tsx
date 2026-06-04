import type { Component } from '@/lib/config/schema'

export default function UnknownComponent({ component }: { component: Component }) {
  if (process.env.NODE_ENV === 'production') return null
  return (
    <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-4 text-sm">
      <p className="font-semibold text-yellow-700">
        Unknown component type: <code className="font-mono">&quot;{component.type}&quot;</code>
      </p>
      <p className="text-yellow-600 text-xs mt-1">
        Register this type in <code className="font-mono">components/runtime/registry.ts</code>
      </p>
      <pre className="mt-2 text-xs overflow-auto text-yellow-800 bg-yellow-100 rounded p-2">
        {JSON.stringify(component.config, null, 2)}
      </pre>
    </div>
  )
}
