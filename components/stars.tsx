"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarsProps {
  value: number
  size?: number
  interactive?: boolean
  onChange?: (value: number) => void
}

export default function Stars({
  value,
  size = 16,
  interactive = false,
  onChange,
}: StarsProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const displayValue = hovered !== null ? hovered : value

  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => interactive && setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue

        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={cn(
              "transition-colors",
              interactive
                ? "cursor-pointer hover:scale-110"
                : "cursor-default"
            )}
            onMouseEnter={() => interactive && setHovered(star)}
            onClick={() => interactive && onChange?.(star)}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-gray-300"
              )}
              style={{ width: size, height: size }}
            />
          </button>
        )
      })}
    </div>
  )
}
