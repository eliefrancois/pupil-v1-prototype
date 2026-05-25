import { Construction } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

interface AdminDevNoticeProps {
  feature: string
}

export default function AdminDevNotice({ feature }: AdminDevNoticeProps) {
  return (
    <Card className="mb-8 border-warning/30 bg-[rgba(245,158,11,0.06)]">
      <CardContent className="flex items-start gap-3 p-4">
        <Construction className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div>
          <p className="text-[13px] font-semibold text-text">
            {feature} is still in development
          </p>
          <p className="mt-1 text-[12px] text-text-2">
            The data below is placeholder mock content for layout preview only.
            It is not connected to production yet.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
