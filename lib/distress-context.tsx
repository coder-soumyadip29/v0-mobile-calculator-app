"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface DistressContextType {
  isDistressActive: boolean
  activateDistress: () => void
  resetDistress: () => void
  distressTimestamp: Date | null
}

const DistressContext = createContext<DistressContextType | undefined>(undefined)

export function DistressProvider({ children }: { children: ReactNode }) {
  const [isDistressActive, setIsDistressActive] = useState(false)
  const [distressTimestamp, setDistressTimestamp] = useState<Date | null>(null)

  const activateDistress = useCallback(() => {
    setIsDistressActive(true)
    setDistressTimestamp(new Date())
    console.log("Distress Active")
  }, [])

  const resetDistress = useCallback(() => {
    setIsDistressActive(false)
    setDistressTimestamp(null)
  }, [])

  return (
    <DistressContext.Provider
      value={{
        isDistressActive,
        activateDistress,
        resetDistress,
        distressTimestamp,
      }}
    >
      {children}
    </DistressContext.Provider>
  )
}

export function useDistress() {
  const context = useContext(DistressContext)
  if (context === undefined) {
    throw new Error("useDistress must be used within a DistressProvider")
  }
  return context
}
