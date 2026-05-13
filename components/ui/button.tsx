import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] font-medium transition-[background,color,transform,box-shadow] duration-150 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:translate-y-0',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground border border-primary shadow-sm hover:bg-[var(--primary-hover)] hover:border-[var(--primary-hover)] hover:-translate-y-[0.5px] hover:shadow',
        secondary:
          'bg-surface text-text border border-border-strong shadow-sm hover:bg-surface-2 hover:-translate-y-[0.5px]',
        soft: 'bg-primary-light text-primary border border-transparent hover:bg-[#E1D9F8] hover:-translate-y-[0.5px]',
        ghost:
          'bg-transparent text-text border border-transparent hover:bg-surface-2',
        outline:
          'bg-transparent text-text border border-border-strong hover:bg-surface-2 hover:-translate-y-[0.5px]',
        danger:
          'bg-danger text-white border border-danger shadow-sm hover:bg-[#DC2626] hover:-translate-y-[0.5px] hover:shadow',
        success:
          'bg-success text-white border border-success shadow-sm hover:bg-[#059669] hover:-translate-y-[0.5px] hover:shadow',
        link: 'bg-transparent text-primary underline-offset-4 hover:underline border border-transparent',
        // shadcn compat
        default:
          'bg-primary text-primary-foreground border border-primary shadow-sm hover:bg-[var(--primary-hover)] hover:border-[var(--primary-hover)] hover:-translate-y-[0.5px] hover:shadow',
        destructive:
          'bg-danger text-white border border-danger shadow-sm hover:bg-[#DC2626] hover:-translate-y-[0.5px] hover:shadow',
      },
      size: {
        sm: 'h-8 px-3 text-[13px] [&_svg]:h-3.5 [&_svg]:w-3.5',
        md: 'h-[42px] px-[18px] text-sm [&_svg]:h-4 [&_svg]:w-4',
        lg: 'h-[52px] px-6 text-base [&_svg]:h-4 [&_svg]:w-4',
        icon: 'h-[42px] w-[42px] p-0',
        // shadcn compat
        default: 'h-[42px] px-[18px] text-sm [&_svg]:h-4 [&_svg]:w-4',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
