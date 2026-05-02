"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ZoomIn,
  ZoomOut,
  Search,
  Layers,
  MapPin,
  Activity,
  Shield,
  Building2,
  Home,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapMarker, EmergencyAlert } from "@/lib/emergency-data"
import { cn } from "@/lib/utils"

interface MapPanelProps {
  markers: MapMarker[]
  selectedAlert?: EmergencyAlert | null
  onMarkerClick?: (marker: MapMarker) => void
}

type MarkerFilter = "all" | "police" | "sos" | "hospital" | "safe_zone"

const markerIcons: Record<MapMarker["type"], React.ReactNode> = {
  police: <Shield className="w-4 h-4" />,
  sos: <Activity className="w-4 h-4" />,
  hospital: <Building2 className="w-4 h-4" />,
  safe_zone: <Home className="w-4 h-4" />,
}

const markerColors: Record<MapMarker["type"], string> = {
  police: "bg-blue-500 border-blue-400 text-white",
  sos: "bg-red-500 border-red-400 text-white",
  hospital: "bg-emerald-500 border-emerald-400 text-white",
  safe_zone: "bg-cyan-500 border-cyan-400 text-white",
}

export function MapPanel({
  markers,
  selectedAlert,
  onMarkerClick,
}: MapPanelProps) {
  const [zoom, setZoom] = useState(100)
  const [searchOpen, setSearchOpen] = useState(false)
  const [filter, setFilter] = useState<MarkerFilter>("all")
  const [heatmapEnabled, setHeatmapEnabled] = useState(false)

  const filteredMarkers = markers.filter(
    (m) => filter === "all" || m.type === filter
  )

  // Calculate positions for markers (simulated distribution)
  const getMarkerPosition = (marker: MapMarker) => {
    // Normalize coordinates to percentage positions
    const latRange = { min: 40.74, max: 40.77 }
    const lngRange = { min: -74.0, max: -73.95 }

    const x =
      ((marker.coordinates.lng - lngRange.min) / (lngRange.max - lngRange.min)) *
      100
    const y =
      100 -
      ((marker.coordinates.lat - latRange.min) / (latRange.max - latRange.min)) *
        100

    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) }
  }

  const activeSOSCount = markers.filter((m) => m.type === "sos").length
  const unitsDeployed = markers.filter(
    (m) => m.type === "police" && m.status === "responding"
  ).length
  const avgResponseTime = "4.2m"
  const coverageRadius = "5.8km"

  return (
    <div className="flex-1 flex flex-col bg-card/30 relative overflow-hidden">
      {/* Map Controls Top */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between">
        {/* Left Controls */}
        <div className="flex flex-col gap-2">
          {/* Search */}
          <AnimatePresence>
            {searchOpen ? (
              <motion.div
                initial={{ width: 40, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 40, opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Input
                  placeholder="Search location..."
                  className="bg-card/90 backdrop-blur-sm border-border"
                  autoFocus
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-card/90 backdrop-blur-sm shrink-0"
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ) : (
              <Button
                variant="outline"
                size="icon"
                className="bg-card/90 backdrop-blur-sm"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
          </AnimatePresence>

          {/* Zoom Controls */}
          <div className="flex flex-col bg-card/90 backdrop-blur-sm rounded-lg border border-border overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-none border-b border-border"
              onClick={() => setZoom((z) => Math.min(200, z + 20))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-none"
              onClick={() => setZoom((z) => Math.max(50, z - 20))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Right Controls - Filter */}
        <div className="flex flex-col gap-2 items-end">
          <div className="flex items-center gap-1 p-1 bg-card/90 backdrop-blur-sm rounded-lg border border-border">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "police" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 gap-1.5"
              onClick={() => setFilter("police")}
            >
              <Shield className="w-3.5 h-3.5" />
              Units
            </Button>
            <Button
              variant={filter === "sos" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 gap-1.5"
              onClick={() => setFilter("sos")}
            >
              <Activity className="w-3.5 h-3.5" />
              SOS
            </Button>
            <Button
              variant={filter === "hospital" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 gap-1.5"
              onClick={() => setFilter("hospital")}
            >
              <Building2 className="w-3.5 h-3.5" />
              Hospitals
            </Button>
          </div>

          {/* Heatmap Toggle */}
          <Button
            variant={heatmapEnabled ? "default" : "outline"}
            size="sm"
            className="bg-card/90 backdrop-blur-sm gap-2"
            onClick={() => setHeatmapEnabled(!heatmapEnabled)}
          >
            <Layers className="w-4 h-4" />
            Heatmap
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div
        className="flex-1 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center" }}
      >
        {/* Grid Overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Heatmap Overlay */}
        {heatmapEnabled && (
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-1/2 w-64 h-64 rounded-full bg-red-500/20 blur-3xl" />
            <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-orange-500/15 blur-3xl" />
            <div className="absolute bottom-1/4 right-1/3 w-56 h-56 rounded-full bg-yellow-500/10 blur-3xl" />
          </div>
        )}

        {/* City Map Placeholder with streets */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Major roads */}
          <path
            d="M0,30 L100,30"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.3"
            fill="none"
          />
          <path
            d="M0,50 L100,50"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.3"
            fill="none"
          />
          <path
            d="M0,70 L100,70"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.3"
            fill="none"
          />
          <path
            d="M25,0 L25,100"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.3"
            fill="none"
          />
          <path
            d="M50,0 L50,100"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.3"
            fill="none"
          />
          <path
            d="M75,0 L75,100"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.3"
            fill="none"
          />
          {/* Diagonal avenue */}
          <path
            d="M0,80 L80,0"
            stroke="rgba(59,130,246,0.3)"
            strokeWidth="0.4"
            fill="none"
          />
        </svg>

        {/* Map Markers */}
        {filteredMarkers.map((marker) => {
          const pos = getMarkerPosition(marker)
          const isSelected =
            selectedAlert && selectedAlert.id === marker.id

          return (
            <motion.div
              key={marker.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isSelected ? 1.3 : 1,
                opacity: 1,
              }}
              whileHover={{ scale: 1.2 }}
              className="absolute cursor-pointer"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              onClick={() => onMarkerClick?.(marker)}
            >
              {/* Pulse for SOS */}
              {marker.type === "sos" && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-red-500"
                  animate={{
                    scale: [1, 2, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ margin: "-8px" }}
                />
              )}

              <div
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center",
                  "shadow-lg transition-all",
                  markerColors[marker.type],
                  isSelected && "ring-2 ring-white ring-offset-2 ring-offset-transparent"
                )}
              >
                {markerIcons[marker.type]}
              </div>

              {/* Label */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
                <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-card/90 text-foreground border border-border">
                  {marker.label}
                </span>
              </div>
            </motion.div>
          )
        })}

        {/* Map Watermark */}
        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground/50">
          Emergency Response GIS System v2.1
        </div>
      </div>

      {/* Map Status Indicators */}
      <div className="absolute bottom-4 right-4 flex items-center gap-3">
        <div className="flex items-center gap-4 px-4 py-2 bg-card/90 backdrop-blur-sm rounded-lg border border-border">
          <div className="text-center">
            <p className="text-lg font-bold text-red-400">{activeSOSCount}</p>
            <p className="text-xs text-muted-foreground">Active Cases</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-lg font-bold text-blue-400">{unitsDeployed}</p>
            <p className="text-xs text-muted-foreground">Units Deployed</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-400">{avgResponseTime}</p>
            <p className="text-xs text-muted-foreground">Avg Response</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-lg font-bold text-cyan-400">{coverageRadius}</p>
            <p className="text-xs text-muted-foreground">Coverage</p>
          </div>
        </div>
      </div>
    </div>
  )
}
