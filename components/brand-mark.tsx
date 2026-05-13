import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

interface BrandMarkProps {
  href?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { h: 22, w: 78 },
  md: { h: 26, w: 92 },
  lg: { h: 32, w: 112 },
}

export default function BrandMark({
  href = '/',
  className,
  size = 'md',
}: BrandMarkProps) {
  const { h, w } = sizes[size]
  const inner = (
    <Image
      src="/pupil-logo.png"
      alt="Pupil"
      width={w}
      height={h}
      priority
      className="h-auto w-auto select-none"
      style={{ height: h }}
    />
  )

  if (href) {
    return (
      <Link
        href={href}
        className={cn('inline-flex items-center', className)}
        aria-label="Pupil home"
      >
        {inner}
      </Link>
    )
  }
  return <span className={cn('inline-flex items-center', className)}>{inner}</span>
}
