"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield,
  MapPin,
  Radio,
  AlertTriangle,
  PhoneCall,
  Clock,
  Wifi,
  Volume2,
  User,
  Navigation,
  Zap,
  Activity,
  Bell,
  Mic,
  Terminal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { subscribeToAlerts, type SOSAlert } from "@/lib/firebase"

function LiveClock() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    // Set initial time only on client to avoid hydration mismatch
    setTime(new Date())
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="font-mono text-sm text-slate-300">
      {time ? time.toLocaleTimeString("en-US", { hour12: false }) : "--:--:--"}
    </span>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = "text-blue-400",
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color?: string
}) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 flex items-center gap-4">
      <div className={cn("p-2 rounded-lg bg-slate-700/50", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-semibold text-white">{value}</p>
      </div>
    </div>
  )
}

function AlertCard({
  alert,
  isNew = false,
}: {
  alert: {
    id: string
    type: string
    location: string
    time: string
    status: string
    priority: "critical" | "high" | "medium"
    hasAudio?: boolean
    hasLiveTracking?: boolean
    latestImage?: string
  }
  isNew?: boolean
}) {
  const priorityStyles = {
    critical: "border-red-500/50 bg-red-500/10",
    high: "border-orange-500/50 bg-orange-500/10",
    medium: "border-yellow-500/50 bg-yellow-500/10",
  }

  const priorityBadge = {
    critical: "bg-red-500 text-white",
    high: "bg-orange-500 text-white",
    medium: "bg-yellow-500 text-black",
  }

  return (
    <motion.div
      initial={isNew ? { x: -50, opacity: 0 } : false}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "border rounded-lg p-4 transition-all",
        priorityStyles[alert.priority],
        isNew && "ring-2 ring-red-500 animate-pulse"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium uppercase",
                priorityBadge[alert.priority]
              )}
            >
              {alert.priority}
            </span>
            <span className="text-xs text-slate-400">{alert.time}</span>
            {alert.hasAudio && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <Mic className="w-3 h-3 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <h4 className="text-sm font-semibold text-white">{alert.type}</h4>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {alert.location}
            {/* Live Tracking Indicator */}
            {alert.hasLiveTracking && (
              <span className="flex items-center gap-1 ml-2 text-green-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium">LIVE TRACKING ACTIVE</span>
              </span>
            )}
          </p>
        </div>
        <span
          className={cn(
            "text-xs px-2 py-1 rounded",
            alert.status === "active"
              ? "bg-red-500/20 text-red-400"
              : "bg-green-500/20 text-green-400"
          )}
        >
          {alert.status}
        </span>
      </div>

      {/* Visual Evidence Section */}
      {alert.latestImage && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
            Visual Evidence
          </span>
          <img
            src={alert.latestImage}
            alt="Captured Evidence"
            className="w-full h-auto rounded-md border border-slate-700 shadow-sm"
            loading="lazy"
          />
        </div>
      )}
    </motion.div>
  )
}

export function PoliceDashboard() {
  const [showFlash, setShowFlash] = useState(false)
  const [firebaseAlerts, setFirebaseAlerts] = useState<SOSAlert[]>([])
  const [localAlerts, setLocalAlerts] = useState([
    {
      id: "1",
      type: "Domestic Disturbance",
      location: "142 Oak Street",
      time: "5 min ago",
      status: "active",
      priority: "high" as const,
      hasLiveTracking: false,
      latestImage: undefined as string | undefined,
    },
    {
      id: "2",
      type: "Traffic Accident",
      location: "I-95 Exit 23",
      time: "12 min ago",
      status: "responding",
      priority: "medium" as const,
      hasLiveTracking: false,
      latestImage: undefined as string | undefined,
    },
  ])
  const processedAlertIds = useRef<Set<string>>(new Set())
  const [currentSOSCoords, setCurrentSOSCoords] = useState<{lat: number | null, lng: number | null} | null>(null)
  const [activeTranscript, setActiveTranscript] = useState<string>("")

  // Subscribe to Firebase alerts
  useEffect(() => {
    const unsubscribe = subscribeToAlerts((alerts) => {
      setFirebaseAlerts(alerts)
      
      // Always update transcript from the most recent active alert
      const activeAlert = alerts.find(a => a.status === "active")
      if (activeAlert?.transcript) {
        setActiveTranscript(activeAlert.transcript)
      }
      
      // Always update coordinates from the most recent active alert (for live tracking)
      if (activeAlert?.latitude && activeAlert?.longitude) {
        setCurrentSOSCoords({ lat: activeAlert.latitude, lng: activeAlert.longitude })
        
        // Update the location string and image in localAlerts for this alert
        setLocalAlerts((prev) => prev.map((localAlert) => {
          if (localAlert.id === activeAlert.id) {
            return {
              ...localAlert,
              location: `GPS: ${activeAlert.latitude!.toFixed(4)}° N, ${activeAlert.longitude!.toFixed(4)}° W`,
              latestImage: activeAlert.latestImage || localAlert.latestImage
            }
          }
          return localAlert
        }))
      }
      
      // Check for new alerts
      alerts.forEach((alert) => {
        if (alert.id && !processedAlertIds.current.has(alert.id)) {
          processedAlertIds.current.add(alert.id)
          
          // Flash effect for new alert
          setShowFlash(true)
          setTimeout(() => setShowFlash(false), 2000)
          
          // Update current SOS coordinates
          if (alert.latitude && alert.longitude) {
            setCurrentSOSCoords({ lat: alert.latitude, lng: alert.longitude })
          }
          
          // Update transcript from active alert
          if (alert.transcript) {
            setActiveTranscript(alert.transcript)
          }
          
          // Create formatted alert for local display
          const locationStr = alert.latitude && alert.longitude
            ? `GPS: ${alert.latitude.toFixed(4)}° N, ${alert.longitude.toFixed(4)}° W`
            : "GPS: Location unavailable"
          
          const formattedAlert = {
            id: alert.id,
            type: "URGENT: Stealth SOS - Live Audio & GPS Streaming",
            location: locationStr,
            time: "Just now",
            status: "active",
            priority: "critical" as const,
            hasAudio: true,
            hasLiveTracking: true,
            latestImage: alert.latestImage,
          }
          
          setLocalAlerts((prev) => [formattedAlert, ...prev])
        }
      })
    })

    return () => unsubscribe()
  }, [])

  const hasActiveSOSAlert = localAlerts.some(a => a.priority === "critical" && a.status === "active")

  return (
    <div className="h-full bg-slate-900 flex flex-col overflow-hidden relative">
      {/* Red flash overlay */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0, 0.4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 bg-red-500 z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Critical SOS Banner */}
      <AnimatePresence>
        {hasActiveSOSAlert && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-600 text-white overflow-hidden"
          >
            <div className="px-4 py-2 flex items-center justify-center gap-3">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              <span className="font-bold text-sm uppercase tracking-wide">
                Critical SOS Alert - Immediate Response Required
              </span>
              <div className="flex items-center gap-2 ml-4">
                <Mic className="w-4 h-4 animate-pulse" />
                <span className="text-xs">Audio Streaming</span>
              </div>
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="h-14 bg-slate-800/80 border-b border-slate-700/50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            <span className="font-semibold text-white">
              Project Aegis - Emergency Command Center
            </span>
          </div>
          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
            ONLINE
          </span>
        </div>

        <div className="flex items-center gap-4">
          <LiveClock />
          <div className="flex items-center gap-2 text-slate-400">
            <Wifi className="w-4 h-4 text-green-400" />
            <Radio className="w-4 h-4" />
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="relative">
            <Bell className="w-5 h-5 text-slate-400" />
            {hasActiveSOSAlert && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
          </div>
          <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
            <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-sm text-slate-300">Dispatch-01</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Live SOS Alerts */}
        <aside className="w-80 bg-slate-800/40 border-r border-slate-700/50 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Live SOS Alerts
              </h2>
              <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                {localAlerts.length} active
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {localAlerts.map((alert, i) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                isNew={i === 0 && alert.priority === "critical"}
              />
            ))}
            
            {/* Live Audio Transcript Terminal Box */}
            <AnimatePresence>
              {hasActiveSOSAlert && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border border-green-500/30 rounded-lg overflow-hidden"
                >
                  {/* Terminal Header */}
                  <div className="bg-green-900/30 px-3 py-2 flex items-center gap-2 border-b border-green-500/30">
                    <Terminal className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-bold text-green-400 uppercase tracking-wider">
                      Live Audio Transcript
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-400">LIVE</span>
                    </div>
                  </div>
                  
                  {/* Terminal Body */}
                  <div className="bg-black p-3 min-h-[120px] max-h-[200px] overflow-y-auto">
                    <div className="font-mono text-sm text-green-400 leading-relaxed">
                      {activeTranscript ? (
                        <>
                          <span className="text-green-600">{">"}</span>{" "}
                          {activeTranscript}
                          <span className="animate-pulse">_</span>
                        </>
                      ) : (
                        <span className="text-green-600/50 italic">
                          {">"} Listening for audio...
                          <span className="animate-pulse">_</span>
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Stats row */}
          <div className="p-4 grid grid-cols-4 gap-4 shrink-0">
            <StatCard
              icon={PhoneCall}
              label="Active Calls"
              value={hasActiveSOSAlert ? 3 : 2}
              color="text-red-400"
            />
            <StatCard
              icon={Navigation}
              label="Units Deployed"
              value={7}
              color="text-blue-400"
            />
            <StatCard
              icon={Clock}
              label="Avg Response"
              value="4.2m"
              color="text-green-400"
            />
            <StatCard
              icon={Activity}
              label="System Health"
              value="98%"
              color="text-emerald-400"
            />
          </div>

          {/* Map placeholder */}
          <div className="flex-1 p-4 pt-0">
            <div className="h-full bg-slate-800/40 border border-slate-700/50 rounded-xl relative overflow-hidden">
              {/* Grid pattern for map look */}
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%">
                  <defs>
                    <pattern
                      id="grid"
                      width="50"
                      height="50"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 50 0 L 0 0 0 50"
                        fill="none"
                        stroke="#475569"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Map header */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1.5 bg-slate-900/80 rounded-lg text-sm text-white font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  Live Tactical Map
                </span>
              </div>

              {/* GPS Coordinates Display */}
              {currentSOSCoords && (
                <div className="absolute top-4 right-16 px-3 py-1.5 bg-red-900/80 rounded-lg text-xs text-white font-mono">
                  LAT: {currentSOSCoords.lat?.toFixed(4) || "N/A"} | LNG: {currentSOSCoords.lng?.toFixed(4) || "N/A"}
                </div>
              )}

              {/* Zoom controls */}
              <div className="absolute top-16 right-4 flex flex-col gap-1">
                <button className="w-8 h-8 bg-slate-900/80 rounded flex items-center justify-center text-white hover:bg-slate-700">
                  +
                </button>
                <button className="w-8 h-8 bg-slate-900/80 rounded flex items-center justify-center text-white hover:bg-slate-700">
                  -
                </button>
              </div>

              {/* Static map markers */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Normal markers */}
                <div className="absolute top-1/4 left-1/3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                </div>
                <div className="absolute top-1/2 left-1/4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                </div>
                <div className="absolute bottom-1/3 right-1/3">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>

                {/* SOS marker - position reacts to live coordinates */}
                <AnimatePresence>
                  {hasActiveSOSAlert && currentSOSCoords && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1,
                        // Simulate map position change based on coordinates
                        // Map lat/lng to screen position (simplified for demo)
                        x: ((currentSOSCoords.lng || 0) % 1) * 200 - 100,
                        y: ((currentSOSCoords.lat || 0) % 1) * 200 - 100,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                      {/* Pulse rings */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full animate-ping" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-red-500/30 rounded-full animate-pulse" />
                      </div>
                      {/* Pin */}
                      <div className="relative flex flex-col items-center">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 ring-4 ring-red-500/30">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-red-500" />
                      </div>
                      {/* Label */}
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded shadow-lg flex items-center gap-1">
                          <Mic className="w-3 h-3" />
                          STEALTH SOS - LIVE
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 flex items-center gap-4 px-3 py-2 bg-slate-900/80 rounded-lg text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-slate-300">Units</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-slate-300">Stations</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-slate-300">SOS</span>
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
