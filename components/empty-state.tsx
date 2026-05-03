import type { ReactNode } from "react"

interface EmptyStateProps {
  icon: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 text-gray-400">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && (
        <p className="mt-1 max-w-sm text-sm text-gray-500">{subtitle}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
