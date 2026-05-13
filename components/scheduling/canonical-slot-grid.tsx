'use client'

import { useMemo } from 'react'

import {
  WEEK_DAYS_DISPLAY,
  formatSlotLabelET,
  slotHoursForDay,
  slotKeyId,
  type SlotKey,
} from '@/lib/scheduling/canonical-slots'
import { cn } from '@/lib/utils'

interface CanonicalSlotGridProps {
  value: Set<string>
  onChange: (next: Set<string>) => void
  disabled?: boolean
  /** When true, rows are shown but cells are read-only */
  readOnly?: boolean
}

export default function CanonicalSlotGrid({
  value,
  onChange,
  disabled = false,
  readOnly = false,
}: CanonicalSlotGridProps) {
  const slotsPerDay = 4
  const headerLabels = useMemo(
    () => Array.from({ length: slotsPerDay }, (_, i) => `Slot ${i + 1}`),
    []
  )

  function toggle(key: SlotKey) {
    if (disabled || readOnly) return
    const id = slotKeyId(key)
    const next = new Set(value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-24 p-2 text-left text-[11px] font-medium uppercase tracking-wide text-text-3" />
            {headerLabels.map((label) => (
              <th
                key={label}
                className="p-2 text-center text-[11px] font-medium uppercase tracking-wide text-text-3"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {WEEK_DAYS_DISPLAY.map(({ dayOfWeek, label }) => {
            const hours = slotHoursForDay(dayOfWeek)
            return (
              <tr key={dayOfWeek}>
                <td className="p-2 align-middle">
                  <p className="text-[14px] font-semibold text-text">{label}</p>
                </td>
                {hours.map((_, slot) => {
                  const key: SlotKey = { day: dayOfWeek, slot }
                  const id = slotKeyId(key)
                  const active = value.has(id)
                  const timeLabel = formatSlotLabelET(key)

                  return (
                    <td key={slot} className="p-1.5">
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        disabled={disabled || readOnly}
                        className={cn(
                          'flex h-14 w-full flex-col items-center justify-center rounded-[var(--radius-sm)] border-2 px-2 text-[12px] font-medium transition-colors',
                          active
                            ? 'border-primary bg-primary-light text-primary'
                            : 'border-line bg-surface text-text-2 hover:border-text-3',
                          (disabled || readOnly) && 'opacity-60'
                        )}
                        aria-pressed={active}
                        aria-label={`${WEEK_DAYS_DISPLAY.find((d) => d.dayOfWeek === dayOfWeek)?.long} ${timeLabel} ${active ? 'available' : 'not available'}`}
                      >
                        <span className="leading-tight">{timeLabel}</span>
                      </button>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-3 text-[12px] text-text-3">
        Times shown in US Eastern. Sessions automatically convert to your
        match&apos;s local time.
      </p>
    </div>
  )
}
