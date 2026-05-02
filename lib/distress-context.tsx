"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { sendSOSAlert, updateSOSTranscript, updateSOSLocation, updateSOSAddress, updateSOSImage } from "./firebase"

// Reverse geocoding using OpenStreetMap Nominatim API
async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          "User-Agent": "ProjectAegis-SOS-App/1.0"
        }
      }
    )
    if (!response.ok) {
      console.error("[Geocode] API error:", response.status)
      return null
    }
    const data = await response.json()
    const address = data.display_name || null
    console.log("[Geocode] Address:", address)
    return address
  } catch (error) {
    console.error("[Geocode] Error:", error)
    return null
  }
}

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
              fullTranscript += result[0].transcript.trim() + ". "
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

    const startVisualEvidenceCapture = async () => {
      // Wait for alert to be created
      await new Promise(resolve => setTimeout(resolve, 500))
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        })
        
        const video = document.createElement("video")
        video.style.position = "absolute"
        video.style.opacity = "0"
        video.style.pointerEvents = "none"
        video.style.width = "0"
        video.style.height = "0"
        video.playsInline = true
        video.muted = true
        
        document.body.appendChild(video)
        video.srcObject = stream
        
        await video.play()
        
        // Wait a bit for the camera to adjust exposure
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const base64Image = canvas.toDataURL("image/jpeg", 0.7)
          
          if (currentAlertId) {
            updateSOSImage(currentAlertId, base64Image).catch(console.error)
          }
        }
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop())
        video.remove()
        canvas.remove()
      } catch (error) {
        console.error("[Camera] Failed to capture visual evidence:", error)
        // Fail gracefully without breaking distress flow
      }
    }

    // Live GPS Tracking with watchPosition
    let watchId: number | null = null

    const startLiveTracking = async () => {
      if (!navigator.geolocation) {
        console.error("[GPS] Geolocation not supported by this browser")
        // Send alert without GPS
        if (!hasSentAlert) {
          hasSentAlert = true
          currentAlertId = await sendSOSAlert({
            latitude: null,
            longitude: null,
            timestamp: new Date().toISOString(),
            status: "active"
          })
          startSpeechRecognition()
          startVisualEvidenceCapture()
        }
        return
      }

      // First, create the initial alert document
      if (!hasSentAlert) {
        hasSentAlert = true
        try {
          // Get initial position first
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords
              setGpsCoordinates({ latitude, longitude })
              console.log(`[GPS] Initial position: ${latitude}, ${longitude}`)
              
              // Create the Firestore document with initial location
              currentAlertId = await sendSOSAlert({
                latitude,
                longitude,
                timestamp: new Date().toISOString(),
                status: "active"
              })
              
              // Fetch initial address via reverse geocoding
              const address = await reverseGeocode(latitude, longitude)
              if (currentAlertId && address) {
                updateSOSAddress(currentAlertId, address).catch(console.error)
              }
              
              // Start speech recognition and visual capture after alert is created
              startSpeechRecognition()
              startVisualEvidenceCapture()
              
              // Now start continuous tracking with watchPosition
              watchId = navigator.geolocation.watchPosition(
                async (pos) => {
                  const { latitude: lat, longitude: lng } = pos.coords
                  setGpsCoordinates({ latitude: lat, longitude: lng })
                  console.log(`[GPS] Live update: ${lat}, ${lng}`)
                  
                  // Update the same Firestore document with new coordinates
                  if (currentAlertId) {
                    updateSOSLocation(currentAlertId, lat, lng).catch(console.error)
                    
                    // Update address via reverse geocoding (throttled to avoid rate limits)
                    const address = await reverseGeocode(lat, lng)
                    if (address) {
                      updateSOSAddress(currentAlertId, address).catch(console.error)
                    }
                  }
                },
                (error) => {
                  console.error("[GPS] Watch error:", error.message)
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
              )
              console.log("[GPS] Live tracking started with watchId:", watchId)
            },
            async (error) => {
              console.error("[GPS] Initial position error:", error.message)
              // Create alert without GPS, then start watching
              currentAlertId = await sendSOSAlert({
                latitude: null,
                longitude: null,
                timestamp: new Date().toISOString(),
                status: "active"
              })
              startSpeechRecognition()
              startVisualEvidenceCapture()
              
              // Try to start watching anyway
              watchId = navigator.geolocation.watchPosition(
                async (pos) => {
                  const { latitude: lat, longitude: lng } = pos.coords
                  setGpsCoordinates({ latitude: lat, longitude: lng })
                  console.log(`[GPS] Live update: ${lat}, ${lng}`)
                  
                  if (currentAlertId) {
                    updateSOSLocation(currentAlertId, lat, lng).catch(console.error)
                  }
                },
                (err) => console.error("[GPS] Watch error:", err.message),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
              )
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          )
        } catch (error) {
          console.error("[Firebase] Error creating alert:", error)
        }
      }
    }

    startLiveTracking()

    // Cleanup
    return () => {
      // Stop GPS watching
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId)
        console.log("[GPS] Live tracking stopped")
      }
      
      // Stop speech recognition
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
