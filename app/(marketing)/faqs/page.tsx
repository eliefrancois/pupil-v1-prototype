"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { FAQ_ITEMS } from "@/lib/constants"

export default function FAQsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Frequently Asked Questions
      </h1>

      <div className="mt-12 divide-y divide-gray-200">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index
          return (
            <div key={index} className="py-5">
              <button
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-base font-medium text-gray-900 pr-4">
                  {item.q}
                </span>
                <span
                  className={`flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  {isOpen ? (
                    <X className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Plus className="h-5 w-5 text-gray-500" />
                  )}
                </span>
              </button>
              {isOpen && (
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {item.a}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
