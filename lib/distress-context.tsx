"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { sendSOSAlert } from "./firebase"

interface DistressContextType {
  isDistressActive: boolean
  activateDistress: () => void
  resetDistress: () => void
  distressTimestamp: Date | null
  gpsCoordinates: { latitude: number; longitude: number } | null
}

const DistressContext = createContext<DistressContextType | undefined>(undefined)

export function DistressProvider({ children }: { children: ReactNode }) {
  const [isDistressActive, setIsDistressActive] = useState(false)
  const [distressTimestamp, setDistressTimestamp] = useState<Date | null>(null)
  const [gpsCoordinates, setGpsCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)

  const activateDistress = useCallback(() => {
    if (isDistressActive) return // Prevent multiple activations
    setIsDistressActive(true)
    setDistressTimestamp(new Date())
    console.log("[v0] Distress Mode Activated")
  }, [isDistressActive])

  const resetDistress = useCallback(() => {
    setIsDistressActive(false)
    setDistressTimestamp(null)
    setGpsCoordinates(null)
  }, [])

  // GPS, Audio sensors, and Firebase alert - triggers when distress becomes active
  useEffect(() => {
    if (!isDistressActive) return

    let hasSentAlert = false

    // GPS Sensor
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setGpsCoordinates({ latitude, longitude })
          console.log(`[GPS] Latitude: ${latitude}, Longitude: ${longitude}`)
          
          // Send alert to Firebase with GPS coordinates
          if (!hasSentAlert) {
            hasSentAlert = true
            sendSOSAlert({
              latitude,
              longitude,
              timestamp: new Date().toISOString(),
              status: "active"
            }).catch(console.error)
          }
        },
        (error) => {
          console.error("[GPS] Permission denied or error:", error.message)
          // Still send alert without GPS
          if (!hasSentAlert) {
            hasSentAlert = true
            sendSOSAlert({
              latitude: null,
              longitude: null,
              timestamp: new Date().toISOString(),
              status: "active"
            }).catch(console.error)
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      console.error("[GPS] Geolocation not supported by this browser")
      // Send alert without GPS
      if (!hasSentAlert) {
        hasSentAlert = true
        sendSOSAlert({
          latitude: null,
          longitude: null,
          timestamp: new Date().toISOString(),
          status: "active"
        }).catch(console.error)
      }
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

        // Stop recording after 5 seconds for demo
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
