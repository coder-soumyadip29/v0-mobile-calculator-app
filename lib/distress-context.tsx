"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { sendSOSAlert, updateSOSTranscript } from "./firebase"

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

    // Speech Recognition for Live Transcription
    let recognition: SpeechRecognition | null = null
    let currentAlertId: string | null = null

    const startSpeechRecognition = async () => {
      // Wait for alert to be created first
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Get the alert ID from the latest alert (set by GPS callback)
      const SpeechRecognitionAPI = (window as Window & { 
        SpeechRecognition?: typeof SpeechRecognition
        webkitSpeechRecognition?: typeof SpeechRecognition 
      }).SpeechRecognition || (window as Window & { 
        SpeechRecognition?: typeof SpeechRecognition
        webkitSpeechRecognition?: typeof SpeechRecognition 
      }).webkitSpeechRecognition

      if (SpeechRecognitionAPI) {
        recognition = new SpeechRecognitionAPI()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "en-US"

        let fullTranscript = ""

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let currentTranscript = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              fullTranscript += result[0].transcript + " "
            } else {
              currentTranscript += result[0].transcript
            }
          }
          
          const transcriptToSend = fullTranscript + currentTranscript
          console.log("[Speech] Transcript:", transcriptToSend)
          
          // Update Firebase with transcript
          if (currentAlertId && transcriptToSend.trim()) {
            updateSOSTranscript(currentAlertId, transcriptToSend.trim()).catch(console.error)
          }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("[Speech] Error:", event.error)
        }

        recognition.onend = () => {
          console.log("[Speech] Recognition ended")
          // Restart if still in distress mode
          if (recognition && isDistressActive) {
            try {
              recognition.start()
              console.log("[Speech] Restarted recognition")
            } catch {
              console.log("[Speech] Could not restart")
            }
          }
        }

        try {
          recognition.start()
          console.log("[Speech] Recognition started - speak now")
        } catch (error) {
          console.error("[Speech] Failed to start:", error)
        }
      } else {
        console.log("[Speech] Speech recognition not supported in this browser")
      }
    }

    // Modify GPS callback to store alert ID
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setGpsCoordinates({ latitude, longitude })
          console.log(`[GPS] Latitude: ${latitude}, Longitude: ${longitude}`)
          
          // Send alert to Firebase with GPS coordinates
          if (!hasSentAlert) {
            hasSentAlert = true
            try {
              currentAlertId = await sendSOSAlert({
                latitude,
                longitude,
                timestamp: new Date().toISOString(),
                status: "active"
              })
              // Start speech recognition after alert is created
              startSpeechRecognition()
            } catch (error) {
              console.error("[Firebase] Error:", error)
            }
          }
        },
        async (error) => {
          console.error("[GPS] Permission denied or error:", error.message)
          // Still send alert without GPS
          if (!hasSentAlert) {
            hasSentAlert = true
            try {
              currentAlertId = await sendSOSAlert({
                latitude: null,
                longitude: null,
                timestamp: new Date().toISOString(),
                status: "active"
              })
              // Start speech recognition after alert is created
              startSpeechRecognition()
            } catch (error) {
              console.error("[Firebase] Error:", error)
            }
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
        }).then(id => {
          currentAlertId = id
          startSpeechRecognition()
        }).catch(console.error)
      }
    }

    // Cleanup
    return () => {
      if (recognition) {
        try {
          recognition.stop()
          console.log("[Speech] Recognition stopped on cleanup")
        } catch {
          // Ignore errors on cleanup
        }
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
