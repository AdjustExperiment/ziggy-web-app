"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === "dark"

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark")
  }

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex w-16 h-8 p-1 rounded-full bg-muted border border-border",
          className
        )}
        aria-hidden
      />
    )
  }

  return (
    <div
      className={cn(
        "flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300 ease-in-out",
        isDark
          ? "bg-zinc-950 border border-zinc-800"
          : "bg-white border border-zinc-200",
        className
      )}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleToggle()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <div className="relative flex justify-between items-center w-full h-full min-h-[1.5rem]">
        {/* Sliding thumb with both icons crossfading */}
        <div
          className={cn(
            "absolute left-1 top-1 flex justify-center items-center w-6 h-6 rounded-full transition-[transform,background-color] duration-300 ease-in-out",
            isDark
              ? "translate-x-0 bg-zinc-800"
              : "translate-x-8 bg-gray-200"
          )}
        >
          <Moon
            className={cn(
              "absolute w-4 h-4 text-white transition-opacity duration-300 ease-in-out",
              isDark ? "opacity-100" : "opacity-0"
            )}
            strokeWidth={1.5}
            aria-hidden
          />
          <Sun
            className={cn(
              "absolute w-4 h-4 text-gray-700 transition-opacity duration-300 ease-in-out",
              isDark ? "opacity-0" : "opacity-100"
            )}
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
        {/* Static icons on both sides (visible in the track) */}
        <div className="flex justify-center items-center w-6 h-6 rounded-full shrink-0 pointer-events-none">
          <Sun
            className={cn(
              "w-4 h-4 transition-opacity duration-300 ease-in-out",
              isDark ? "text-gray-500 opacity-100" : "opacity-0"
            )}
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
        <div className="flex justify-center items-center w-6 h-6 rounded-full shrink-0 pointer-events-none">
          <Moon
            className={cn(
              "w-4 h-4 transition-opacity duration-300 ease-in-out",
              isDark ? "opacity-0" : "text-black opacity-100"
            )}
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
      </div>
    </div>
  )
}
