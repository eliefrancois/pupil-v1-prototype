'use client'

import { useEffect, useMemo, useState } from 'react'

import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import {
  COLLEGE_SEARCH_MIN_LENGTH,
  collegeLocation,
  type CollegeRecord,
} from '@/lib/colleges'

const SEARCH_DEBOUNCE_MS = 250

function toOption(college: CollegeRecord): ComboboxOption {
  return {
    value: college.id,
    label: college.name,
    description: collegeLocation(college),
  }
}

interface CollegePickerProps {
  id?: string
  value: string
  selected: CollegeRecord | null
  onChange: (value: string, college: CollegeRecord | null) => void
  pinnedOption?: ComboboxOption
}

export function CollegePicker({
  id,
  value,
  selected,
  onChange,
  pinnedOption,
}: CollegePickerProps) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<CollegeRecord[]>([])
  const [loading, setLoading] = useState(false)
  const query = search.trim()
  const tooShort = query.length < COLLEGE_SEARCH_MIN_LENGTH

  useEffect(() => {
    if (tooShort) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/colleges/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        )
        if (!res.ok) throw new Error(`College search failed: ${res.status}`)
        const body = (await res.json()) as { colleges: CollegeRecord[] }
        setResults(body.colleges)
      } catch (err) {
        if (controller.signal.aborted) return
        console.error(err)
        setResults([])
      }
      setLoading(false)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, tooShort])

  const options = useMemo(() => results.map(toOption), [results])
  const selectedOption = useMemo(
    () => (selected ? toOption(selected) : undefined),
    [selected]
  )

  const handleValueChange = (next: string) => {
    const college =
      results.find((c) => c.id === next) ??
      (selected?.id === next ? selected : null)
    onChange(next, college)
  }

  return (
    <Combobox
      id={id}
      options={options}
      value={value}
      onValueChange={handleValueChange}
      onSearchChange={setSearch}
      loading={loading}
      selectedOption={selectedOption}
      placeholder="Search for your school..."
      searchPlaceholder="Search 10,000+ schools worldwide..."
      emptyMessage={
        tooShort
          ? 'Type at least 2 letters to search.'
          : 'No schools match. Pick Other to type yours in.'
      }
      pinnedOption={pinnedOption}
    />
  )
}
