import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
        {icon}
      </div>
      <h3 className="text-[16px] font-semibold text-text">{title}</h3>
      {subtitle && (
        <p className="mt-1 max-w-sm text-[14px] text-text-2">{subtitle}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
