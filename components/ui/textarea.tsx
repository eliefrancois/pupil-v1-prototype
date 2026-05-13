import * as React from 'react'

import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[88px] w-full rounded-[var(--radius-sm)] border border-border-strong bg-surface px-3 py-2.5 text-[14px] text-text transition-[border-color,box-shadow] duration-150 placeholder:text-text-3 focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_4px_var(--primary-light)] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
