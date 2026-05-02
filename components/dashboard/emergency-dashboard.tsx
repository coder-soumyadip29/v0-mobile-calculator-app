"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardHeader } from "./header"
import { SOSSidebar } from "./sos-sidebar"
import { MapPanel } from "./map-panel"
import { StatsWidgets } from "./stats-widgets"
import {
  EmergencyAlert,
  PoliceUnit,
  MapMarker,
  generateMockAlerts,
  generateMockUnits,
  generateMapMarkers,
} from "@/lib/emergency-data"

export function EmergencyDashboard() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([])
  const [units, setUnits] = useState<PoliceUnit[]>([])
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null)

  // Initialize data
  useEffect(() => {
    const initialAlerts = generateMockAlerts()
    const initialUnits = generateMockUnits()
    setAlerts(initialAlerts)
    setUnits(initialUnits)
    setMarkers(generateMapMarkers(initialAlerts, initialUnits))
  }, [])

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts((prev) =>
        prev.map((alert) => ({
          ...alert,
          timestamp: alert.timestamp, // Keep original timestamp
        }))
      )
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleAlertSelect = useCallback((alert: EmergencyAlert) => {
    setSelectedAlert(alert)
  }, [])

  const handleMarkerClick = useCallback(
    (marker: MapMarker) => {
      if (marker.type === "sos") {
        const alert = alerts.find((a) => a.id === marker.id)
        if (alert) setSelectedAlert(alert)
      }
    },
    [alerts]
  )

  // Calculate stats
  const totalActive = alerts.filter((a) => a.status !== "resolved").length
  const criticalCases = alerts.filter(
    (a) => a.threatLevel === "critical" && a.status !== "resolved"
  ).length
  const availableUnits = units.filter((u) => u.status === "available").length
  const resolvedToday = alerts.filter((a) => a.status === "resolved").length
  const avgResponseTime = 4
  const highRiskAlerts = alerts.filter(
    (a) =>
      (a.threatLevel === "high" || a.threatLevel === "critical") &&
      a.status !== "resolved"
  ).length

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <DashboardHeader />

      <div className="flex-1 flex overflow-hidden">
        <SOSSidebar
          alerts={alerts}
          onAlertSelect={handleAlertSelect}
          selectedAlertId={selectedAlert?.id}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <StatsWidgets
            totalActive={totalActive}
            criticalCases={criticalCases}
            availableUnits={availableUnits}
            resolvedToday={resolvedToday}
            avgResponseTime={avgResponseTime}
            highRiskAlerts={highRiskAlerts}
          />

          <MapPanel
            markers={markers}
            selectedAlert={selectedAlert}
            onMarkerClick={handleMarkerClick}
          />
        </main>
      </div>
    </div>
  )
}
