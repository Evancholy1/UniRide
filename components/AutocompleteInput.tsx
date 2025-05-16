// components/AutocompleteInput.tsx
'use client';

import { useState, useEffect, useMemo } from 'react'
import debounce from 'lodash/debounce'

interface AutocompleteInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

type Suggestion = { description: string; place_id: string }

export function AutocompleteInput({
  value,
  onChange,
  placeholder,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showList, setShowList] = useState(false)

  const fetchSuggestions = useMemo(
    () =>
      debounce(async (input: string) => {
        if (!input) {
          setSuggestions([])
          return
        }
        try {
          const res = await fetch(`/api/autocomplete?input=${encodeURIComponent(input)}`)
          const json = await res.json()
          setSuggestions(json.predictions || [])
        } catch (err) {
          console.error('Autocomplete fetch error', err)
          setSuggestions([])
        }
      }, 300),
    []
  )

  useEffect(() => {
    fetchSuggestions(value)
  }, [value, fetchSuggestions])

  return (
    <div className="relative">
      <input
        type="text"
        className="w-full border p-2 rounded bg-gray-900 text-white"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setShowList(true)
        }}
        onBlur={() => setTimeout(() => setShowList(false), 200)}
      />

      {showList && suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white text-black w-full border rounded max-h-60 overflow-auto">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              className="p-2 hover:bg-gray-200 cursor-pointer"
              onClick={() => {
                onChange(s.description)
                setShowList(false)
              }}
            >
              {s.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
