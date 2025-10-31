import { useState, useCallback } from "react"

export function useSubmenuState(initialState: Record<string, boolean> = {}) {
  const [openStates, setOpenStates] = useState(initialState)

  const toggleSubmenu = useCallback((id: string) => {
    setOpenStates((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  return { openStates, toggleSubmenu }
}
