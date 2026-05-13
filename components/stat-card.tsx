import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  trend?: string
  icon?: ReactNode
  tone?: 'warning' | 'danger' | 'success'
}

const toneStyles: Record<string, string> = {
  warning: 'text-warning',
  danger: 'text-danger',
  success: 'text-success',
}

export default function StatCard({
  label,
  value,
  trend,
  icon,
  tone,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-6">
        <div className="space-y-1">
          <p className="text-[13px] font-medium text-text-2">{label}</p>
          <p className="display text-[32px] font-medium leading-tight tracking-tight text-text">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                'text-[12px] font-medium',
                tone ? toneStyles[tone] : 'text-text-2'
              )}
            >
              {trend}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-primary-light text-primary">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
