'use client'

// Shared, taxonomy-driven field renderer used by BOTH the mentee and mentor
// onboarding forms. Renders a single canonical Dimension as chips (multi) or a
// single-select chip group, with the standardized self-describe write-in. Uses
// the app's design tokens (primary / surface / border-strong) so both forms
// share one visual language.

import { Check } from 'lucide-react'

import type { Dimension } from '@/lib/identity-taxonomy'
import { SELF_DESCRIBE } from '@/lib/identity-taxonomy'
import { cn } from '@/lib/utils'

export type Role = 'mentee' | 'mentor'

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-3 py-2 text-left text-[13px] font-medium transition-all',
        selected
          ? 'border-primary bg-primary-light text-primary'
          : 'border-border-strong bg-surface text-text hover:border-primary'
      )}
    >
      {label}
      {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
    </button>
  )
}

function SelfDescribeInput({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Tell us in your own words"
      maxLength={120}
      className="mt-2 w-full rounded-[var(--radius-sm)] border border-border-strong bg-surface px-3 py-2 text-[14px] text-text transition-[border-color,box-shadow] duration-150 focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--primary-light)]"
    />
  )
}

export interface DimensionFieldProps {
  dim: Dimension
  role: Role
  /** string[] for multi-select dims, string for single-select dims. */
  value: string[] | string
  onChange: (next: string[] | string) => void
  selfDescribeText: string
  onSelfDescribeTextChange: (v: string) => void
}

export function DimensionField({
  dim,
  role,
  value,
  onChange,
  selfDescribeText,
  onSelfDescribeTextChange,
}: DimensionFieldProps) {
  const label = role === 'mentee' ? dim.menteeLabel : dim.mentorLabel
  const help = role === 'mentee' ? dim.menteeHelp : dim.mentorHelp
  const required = dim.required[role]

  const isMulti = dim.select === 'multi'
  const selectedArray = isMulti
    ? (value as string[])
    : value
      ? [value as string]
      : []
  const showSelfDescribe = selectedArray.includes(SELF_DESCRIBE)

  const toggle = (code: string) => {
    if (isMulti) {
      const arr = value as string[]
      onChange(
        arr.includes(code) ? arr.filter((c) => c !== code) : [...arr, code]
      )
    } else {
      onChange(value === code ? '' : code)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-[14px] font-medium text-text">{label}</span>
        {required ? (
          <span className="text-[12px] font-medium text-primary">Required</span>
        ) : (
          <span className="text-[12px] text-text-3">Optional</span>
        )}
      </div>
      {help && <p className="text-[12px] text-text-3">{help}</p>}
      <div className="flex flex-wrap gap-2">
        {dim.options.map((opt) => (
          <Chip
            key={opt.code}
            label={opt.label}
            selected={selectedArray.includes(opt.code)}
            onClick={() => toggle(opt.code)}
          />
        ))}
      </div>
      {showSelfDescribe && (
        <SelfDescribeInput
          id={`${dim.dimension_key}-self-describe`}
          value={selfDescribeText}
          onChange={onSelfDescribeTextChange}
        />
      )}
    </div>
  )
}
