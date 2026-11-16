'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => (
  <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    {children}
  </DialogPrimitive.Root>
)
Dialog.displayName = 'Dialog'

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-[rgba(26,26,46,0.45)] backdrop-blur-sm animate-in fade-in-0',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = 'DialogOverlay'

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Called on outside click and the close button. Without it, outside clicks do nothing and no close button renders. */
  onClose?: () => void
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, onClose, onPointerDownOutside, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'pointer-events-auto relative z-50 grid w-full max-w-lg gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-lg animate-in fade-in-0 zoom-in-95 focus:outline-none',
          className
        )}
        onPointerDownOutside={(event) => {
          onPointerDownOutside?.(event)
          event.preventDefault()
          onClose?.()
        }}
        {...props}
      >
        {children}
        {onClose && (
          <button
            type="button"
            className="absolute right-4 top-4 rounded-sm text-text-2 transition-colors hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </DialogPrimitive.Content>
    </div>
  </DialogPrimitive.Portal>
))
DialogContent.displayName = 'DialogContent'

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5 text-left',
      className
    )}
    {...props}
  />
))
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
      className
    )}
    {...props}
  />
))
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-tight tracking-tight text-text',
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-text-2', className)}
    {...props}
  />
))
DialogDescription.displayName = 'DialogDescription'

export {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
