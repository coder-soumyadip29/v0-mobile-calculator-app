"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

interface DistressContextType {
  isDistressActive: boolean
  activateDistress: () => void
  resetDistress: () => void
  distressTimestamp: Date | null
  gpsCoordinates: { latitude: number; longitude: number } | null
}

const DistressContext = createContext<DistressContextType | undefined>(undefined)

function BlackoutOverlay({ isActive }: { isActive: boolean }) {
  if (!isActive) return null
  return (
    <div 
      className="fixed inset-0 bg-black z-[9999] w-screen h-screen" 
      aria-hidden="true"
    />
  )
}

export function DistressProvider({ children }: { children: ReactNode }) {
  const [isDistressActive, setIsDistressActive] = useState(false)
  const [distressTimestamp, setDistressTimestamp] = useState<Date | null>(null)
  const [gpsCoordinates, setGpsCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)

  const activateDistress = useCallback(() => {
    setIsDistressActive(true)
    setDistressTimestamp(new Date())
    console.log("Distress Active")
  }, [])

  const resetDistress = useCallback(() => {
    setIsDistressActive(false)
    setDistressTimestamp(null)
    setGpsCoordinates(null)
  }, [])

  // GPS and Audio sensors - triggers when distress becomes active
  useEffect(() => {
    if (!isDistressActive) return

    // GPS Sensor
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setGpsCoordinates({ latitude, longitude })
          console.log(`[GPS] Latitude: ${latitude}, Longitude: ${longitude}`)
        },
        (error) => {
          console.error("[GPS] Permission denied or error:", error.message)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      console.error("[GPS] Geolocation not supported by this browser")
    }

    // Audio Recording
    let mediaRecorder: MediaRecorder | null = null
    let audioChunks: Blob[] = []

    const startAudioRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorder = new MediaRecorder(stream)
        audioChunks = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data)
          }
        }

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
          console.log(`[Audio] Recording captured successfully. Blob size: ${audioBlob.size} bytes`)
          // Stop all tracks to release the microphone
          stream.getTracks().forEach(track => track.stop())
        }

        mediaRecorder.start()
        console.log("[Audio] Recording started...")

        // Stop recording after 5 seconds
        setTimeout(() => {
          if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop()
            console.log("[Audio] Recording stopped after 5 seconds")
          }
        }, 5000)

      } catch (error) {
        if (error instanceof Error) {
          console.error("[Audio] Permission denied or error:", error.message)
        } else {
          console.error("[Audio] Unknown error occurred")
        }
      }
    }

    startAudioRecording()

    // Cleanup
    return () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop()
      }
    }
  }, [isDistressActive])

  return (
    <DistressContext.Provider
      value={{
        isDistressActive,
        activateDistress,
        resetDistress,
        distressTimestamp,
        gpsCoordinates,
      }}
    >
      {children}
      <BlackoutOverlay isActive={isDistressActive} />
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
