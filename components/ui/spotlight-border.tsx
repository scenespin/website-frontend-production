import type React from "react"
import { Spotlight } from "@/components/core/spotlight"

export function SpotlightBorder({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-cyan-500/20 p-[1px] shadow-lg">
      <Spotlight className="from-purple-400 via-blue-400 to-cyan-400 blur-xl" size={120} />
      <div className="relative h-full w-full rounded-xl bg-white/10 backdrop-blur-sm">{children}</div>
    </div>
  )
}

