"use client"

import { motion } from "framer-motion"
import {
  MapPin,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Send,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  EmergencyAlert,
  incidentTypeLabels,
  threatLevelColors,
  statusColors,
} from "@/lib/emergency-data"
import { cn } from "@/lib/utils"

interface AlertCardProps {
  alert: EmergencyAlert
  isNew?: boolean
  onAccept?: () => void
  onDispatch?: () => void
  onViewDetails?: () => void
}

export function AlertCard({
  alert,
  isNew = false,
  onAccept,
  onDispatch,
  onViewDetails,
}: AlertCardProps) {
  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  const threatGlow = {
    critical: "shadow-red-500/20 hover:shadow-red-500/30",
    high: "shadow-orange-500/20 hover:shadow-orange-500/30",
    medium: "shadow-yellow-500/20 hover:shadow-yellow-500/30",
    low: "shadow-emerald-500/20 hover:shadow-emerald-500/30",
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "p-4 rounded-lg bg-card border border-border",
        "transition-all duration-200 cursor-pointer",
        "shadow-lg",
        threatGlow[alert.threatLevel],
        isNew && "ring-2 ring-primary/50"
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Pulse indicator for new/pending alerts */}
          {(isNew || alert.status === "pending") && (
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-red-500"
            />
          )}
          <span className="text-sm font-mono font-semibold text-primary">
            {alert.id}
          </span>
        </div>
        <span
          className={cn(
            "px-2 py-0.5 rounded text-xs font-medium border",
            threatLevelColors[alert.threatLevel]
          )}
        >
          {alert.threatLevel.toUpperCase()}
        </span>
      </div>

      {/* Incident Type */}
      <div className="mb-2">
        <span className="text-sm font-medium text-foreground">
          {incidentTypeLabels[alert.incidentType]}
        </span>
      </div>

      {/* Caller Info */}
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        <User className="w-3.5 h-3.5" />
        <span className="text-xs">
          {alert.callerName || "Anonymous Caller"}
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        <MapPin className="w-3.5 h-3.5" />
        <span className="text-xs truncate">{alert.address}</span>
      </div>

      {/* Coordinates */}
      <div className="text-xs font-mono text-muted-foreground mb-2">
        {alert.coordinates.lat.toFixed(4)}, {alert.coordinates.lng.toFixed(4)}
      </div>

      {/* Timestamp & Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs">{formatTimestamp(alert.timestamp)}</span>
        </div>
        <span
          className={cn(
            "px-2 py-0.5 rounded text-xs font-medium",
            statusColors[alert.status]
          )}
        >
          {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {alert.status === "pending" && (
          <>
            <Button
              size="sm"
              variant="default"
              className="flex-1 gap-1.5 h-8 text-xs"
              onClick={onAccept}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 gap-1.5 h-8 text-xs"
              onClick={onDispatch}
            >
              <Send className="w-3.5 h-3.5" />
              Dispatch
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "gap-1.5 h-8 text-xs",
            alert.status === "pending" ? "" : "flex-1"
          )}
          onClick={onViewDetails}
        >
          <Eye className="w-3.5 h-3.5" />
          Details
        </Button>
      </div>
    </motion.div>
  )
}
