import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium leading-none whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-primary-light text-primary border border-transparent',
        secondary:
          'bg-surface-2 text-text-2 border border-border',
        outline:
          'bg-transparent text-text border border-border-strong',
        success:
          'border border-transparent text-[#047857] bg-[rgba(16,185,129,0.12)]',
        warning:
          'border border-transparent text-[#92400E] bg-[rgba(245,158,11,0.14)]',
        danger:
          'border border-transparent text-[#B91C1C] bg-[rgba(239,68,68,0.12)]',
        purple:
          'bg-primary-light text-primary border border-transparent',
        // shadcn compat
        destructive:
          'border border-transparent text-[#B91C1C] bg-[rgba(239,68,68,0.12)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
