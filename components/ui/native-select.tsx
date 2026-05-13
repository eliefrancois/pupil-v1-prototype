import * as React from 'react'

import { cn } from '@/lib/utils'

export interface NativeSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-[42px] w-full appearance-none rounded-[var(--radius-sm)] border border-border-strong bg-surface px-3 pr-9 text-[14px] text-text transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_4px_var(--primary-light)] disabled:cursor-not-allowed disabled:opacity-50',
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
NativeSelect.displayName = 'NativeSelect'

export interface NativeSelectOptionProps
  extends React.OptionHTMLAttributes<HTMLOptionElement> {}

const NativeSelectOption = React.forwardRef<
  HTMLOptionElement,
  NativeSelectOptionProps
>(({ className, ...props }, ref) => {
  return <option ref={ref} className={cn(className)} {...props} />
})
NativeSelectOption.displayName = 'NativeSelectOption'

export { NativeSelect, NativeSelectOption }
