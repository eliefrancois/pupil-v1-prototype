'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

import { Button, type ButtonProps } from '@/components/ui/button'
import { markUpgradeModalSeen } from '@/lib/actions/billing-actions'

import UpgradeDialog, { type MentorSummary, type UpgradeSource } from './upgrade-dialog'

interface UpgradeButtonProps extends Omit<ButtonProps, 'onClick'> {
  mentor: MentorSummary | null
  billingEnabled: boolean
  source: UpgradeSource
  /** Open on mount and record it so the dashboard only auto-opens once. */
  autoOpen?: boolean
  recordAutoOpen?: boolean
}

export default function UpgradeButton({
  mentor,
  billingEnabled,
  source,
  autoOpen = false,
  recordAutoOpen = false,
  children,
  ...buttonProps
}: UpgradeButtonProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(autoOpen)
  const recorded = useRef(false)

  useEffect(() => {
    if (!autoOpen || !recordAutoOpen || recorded.current) return
    recorded.current = true
    void markUpgradeModalSeen()
  }, [autoOpen, recordAutoOpen])

  return (
    <>
      <Button {...buttonProps} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <UpgradeDialog
        open={open}
        onOpenChange={setOpen}
        mentor={mentor}
        billingEnabled={billingEnabled}
        source={source}
        returnPath={pathname || '/dashboard'}
      />
    </>
  )
}
