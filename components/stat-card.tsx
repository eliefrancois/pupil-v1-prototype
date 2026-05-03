import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  trend?: string
  icon?: ReactNode
  tone?: "warning" | "danger" | "success"
}

const toneStyles: Record<string, string> = {
  warning: "text-yellow-600",
  danger: "text-red-600",
  success: "text-green-600",
}

export default function StatCard({ label, value, trend, icon, tone }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-6">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "text-xs font-medium",
                tone ? toneStyles[tone] : "text-gray-500"
              )}
            >
              {trend}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-md bg-gray-100 p-2 text-gray-600">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
