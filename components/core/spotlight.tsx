'use client';

import { cn } from "@/lib/utils"
import React from "react"

interface SpotlightProps {
  className?: string
  size?: number
}

export function Spotlight({ className, size = 96 }: SpotlightProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100",
        className
      )}
      style={{
        background: `radial-gradient(${size}px circle at var(--mouse-x) var(--mouse-y), currentColor, transparent 40%)`,
      }}
    />
  )
}

