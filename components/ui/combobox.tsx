'use client'

import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export type ComboboxOption = {
  value: string
  label: string
  description?: string
  keywords?: string
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  contentClassName?: string
  id?: string
  /**
   * Display this many options before requiring search. Useful for huge lists
   * where rendering 1500 options up-front would jank scrolling.
   */
  maxRendered?: number
  /** Always shown below the results, even when the search matches nothing. */
  pinnedOption?: ComboboxOption
  /**
   * Async mode: the parent fetches `options` for each search term, so the
   * built-in filter is turned off.
   */
  onSearchChange?: (search: string) => void
  loading?: boolean
  /** Label source for a `value` that isn't in the current async results. */
  selectedOption?: ComboboxOption
}

function itemValue(option: ComboboxOption) {
  return `${option.label} ${option.keywords ?? ''}`.trim()
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results.',
  disabled,
  className,
  triggerClassName,
  contentClassName,
  id,
  maxRendered = 200,
  pinnedOption,
  onSearchChange,
  loading,
  selectedOption,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const isAsync = !!onSearchChange

  const selected = React.useMemo(() => {
    if (pinnedOption?.value === value) return pinnedOption
    return (
      options.find((o) => o.value === value) ??
      (selectedOption?.value === value ? selectedOption : undefined)
    )
  }, [options, value, pinnedOption, selectedOption])

  const visibleOptions = React.useMemo(() => {
    if (isAsync || search.trim().length > 0) return options
    return options.slice(0, maxRendered)
  }, [options, search, maxRendered, isAsync])

  const truncated = options.length > visibleOptions.length

  // cmdk keeps the highlight on whatever was first when the list rendered
  // (often the pinned option while results load), so move it to the top
  // result whenever async results arrive.
  const [highlighted, setHighlighted] = React.useState('')
  React.useEffect(() => {
    if (!isAsync) return
    const first = options[0]
    setHighlighted(first ? itemValue(first) : pinnedOption?.value ?? '')
  }, [isAsync, options, pinnedOption])

  const updateSearch = (next: string) => {
    setSearch(next)
    onSearchChange?.(next)
  }

  const choose = (next: string) => {
    onValueChange(next)
    setOpen(false)
    updateSearch('')
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'flex h-[42px] w-full items-center justify-between rounded-[var(--radius-sm)] border border-border-strong bg-surface px-3 text-[14px] text-text transition-[border-color,box-shadow] duration-150 hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--primary-light)] disabled:cursor-not-allowed disabled:opacity-50',
              !selected && 'text-text-3',
              triggerClassName
            )}
          >
            <span className="truncate text-left">
              {selected ? selected.label : placeholder}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-text-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn(
            'w-[var(--radix-popover-trigger-width)] p-0',
            contentClassName
          )}
        >
          <Command
            shouldFilter={!isAsync}
            {...(isAsync && {
              value: highlighted,
              onValueChange: setHighlighted,
            })}
          >
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={updateSearch}
            />
            <CommandList>
              {isAsync ? (
                options.length === 0 && (
                  <p className="py-6 text-center text-[13px] text-text-3">
                    {loading ? 'Searching...' : emptyMessage}
                  </p>
                )
              ) : (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              )}
              <CommandGroup>
                {visibleOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={itemValue(option)}
                    onSelect={() => choose(option.value)}
                  >
                    <span className="flex-1 truncate">
                      {option.label}
                      {option.description && (
                        <span className="ml-2 text-[12px] text-text-3">
                          {option.description}
                        </span>
                      )}
                    </span>
                    {value === option.value && (
                      <Check className="ml-2 h-4 w-4 text-primary" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              {truncated && (
                <p className="px-3 py-2 text-[11px] text-text-3">
                  Showing {visibleOptions.length} of {options.length}. Type to
                  search the full list.
                </p>
              )}
              {pinnedOption && (
                <CommandGroup forceMount className="border-t border-border">
                  <CommandItem
                    forceMount
                    value={pinnedOption.value}
                    onSelect={() => choose(pinnedOption.value)}
                  >
                    <span className="flex-1 truncate">{pinnedOption.label}</span>
                    {value === pinnedOption.value && (
                      <Check className="ml-2 h-4 w-4 text-primary" />
                    )}
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
