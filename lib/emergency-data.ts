export type ThreatLevel = "low" | "medium" | "high" | "critical"
export type IncidentType =
  | "domestic_violence"
  | "robbery"
  | "medical_emergency"
  | "kidnapping"
  | "accident"
  | "suspicious_activity"
  | "distress_signal"
export type AlertStatus = "pending" | "assigned" | "resolved"

export interface EmergencyAlert {
  id: string
  callerName: string | null
  timestamp: Date
  coordinates: { lat: number; lng: number }
  incidentType: IncidentType
  threatLevel: ThreatLevel
  status: AlertStatus
  address: string
  description: string
}

export interface PoliceUnit {
  id: string
  callSign: string
  status: "available" | "responding" | "on_scene" | "offline"
  coordinates: { lat: number; lng: number }
  assignedCase?: string
}

export interface MapMarker {
  id: string
  type: "police" | "sos" | "hospital" | "safe_zone"
  coordinates: { lat: number; lng: number }
  label: string
  status?: string
}

export const incidentTypeLabels: Record<IncidentType, string> = {
  domestic_violence: "Domestic Violence",
  robbery: "Robbery",
  medical_emergency: "Medical Emergency",
  kidnapping: "Kidnapping",
  accident: "Accident",
  suspicious_activity: "Suspicious Activity",
  distress_signal: "Distress Signal",
}

export const threatLevelColors: Record<ThreatLevel, string> = {
  low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
}

export const statusColors: Record<AlertStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  assigned: "bg-blue-500/20 text-blue-400",
  resolved: "bg-emerald-500/20 text-emerald-400",
}

export const generateMockAlerts = (): EmergencyAlert[] => {
  const now = new Date()
  return [
    {
      id: "SOS-7842",
      callerName: "Sarah Mitchell",
      timestamp: new Date(now.getTime() - 2 * 60000),
      coordinates: { lat: 40.7589, lng: -73.9851 },
      incidentType: "domestic_violence",
      threatLevel: "critical",
      status: "pending",
      address: "245 W 47th St, Manhattan",
      description: "Loud screaming heard, possible assault in progress",
    },
    {
      id: "SOS-7841",
      callerName: null,
      timestamp: new Date(now.getTime() - 5 * 60000),
      coordinates: { lat: 40.7484, lng: -73.9857 },
      incidentType: "robbery",
      threatLevel: "high",
      status: "assigned",
      address: "350 5th Ave, Manhattan",
      description: "Armed robbery at convenience store, suspect fleeing on foot",
    },
    {
      id: "SOS-7840",
      callerName: "James Rodriguez",
      timestamp: new Date(now.getTime() - 8 * 60000),
      coordinates: { lat: 40.7614, lng: -73.9776 },
      incidentType: "medical_emergency",
      threatLevel: "high",
      status: "assigned",
      address: "30 Rockefeller Plaza",
      description: "Elderly male collapsed, not breathing",
    },
    {
      id: "SOS-7839",
      callerName: "Maria Chen",
      timestamp: new Date(now.getTime() - 12 * 60000),
      coordinates: { lat: 40.7527, lng: -73.9772 },
      incidentType: "suspicious_activity",
      threatLevel: "medium",
      status: "pending",
      address: "Grand Central Terminal",
      description: "Unattended package near main concourse",
    },
    {
      id: "SOS-7838",
      callerName: null,
      timestamp: new Date(now.getTime() - 15 * 60000),
      coordinates: { lat: 40.7580, lng: -73.9855 },
      incidentType: "distress_signal",
      threatLevel: "critical",
      status: "pending",
      address: "Times Square",
      description: "Silent alarm triggered from mobile device",
    },
    {
      id: "SOS-7837",
      callerName: "David Park",
      timestamp: new Date(now.getTime() - 20 * 60000),
      coordinates: { lat: 40.7489, lng: -73.9680 },
      incidentType: "accident",
      threatLevel: "medium",
      status: "assigned",
      address: "E 42nd St & 2nd Ave",
      description: "Multi-vehicle collision, possible injuries",
    },
    {
      id: "SOS-7836",
      callerName: "Anonymous",
      timestamp: new Date(now.getTime() - 25 * 60000),
      coordinates: { lat: 40.7549, lng: -73.9840 },
      incidentType: "kidnapping",
      threatLevel: "critical",
      status: "assigned",
      address: "W 42nd St & 7th Ave",
      description: "Child abduction reported, suspect in black sedan",
    },
    {
      id: "SOS-7835",
      callerName: "Lisa Thompson",
      timestamp: new Date(now.getTime() - 35 * 60000),
      coordinates: { lat: 40.7505, lng: -73.9934 },
      incidentType: "robbery",
      threatLevel: "low",
      status: "resolved",
      address: "Hudson Yards",
      description: "Attempted theft, suspect apprehended by security",
    },
  ]
}

export const generateMockUnits = (): PoliceUnit[] => [
  {
    id: "unit-1",
    callSign: "ALPHA-12",
    status: "available",
    coordinates: { lat: 40.7580, lng: -73.9855 },
  },
  {
    id: "unit-2",
    callSign: "BRAVO-7",
    status: "responding",
    coordinates: { lat: 40.7614, lng: -73.9776 },
    assignedCase: "SOS-7841",
  },
  {
    id: "unit-3",
    callSign: "CHARLIE-3",
    status: "on_scene",
    coordinates: { lat: 40.7484, lng: -73.9857 },
    assignedCase: "SOS-7840",
  },
  {
    id: "unit-4",
    callSign: "DELTA-9",
    status: "available",
    coordinates: { lat: 40.7527, lng: -73.9772 },
  },
  {
    id: "unit-5",
    callSign: "ECHO-15",
    status: "responding",
    coordinates: { lat: 40.7549, lng: -73.9840 },
    assignedCase: "SOS-7836",
  },
  {
    id: "unit-6",
    callSign: "FOXTROT-2",
    status: "offline",
    coordinates: { lat: 40.7505, lng: -73.9934 },
  },
]

export const generateMapMarkers = (
  alerts: EmergencyAlert[],
  units: PoliceUnit[]
): MapMarker[] => {
  const markers: MapMarker[] = []

  // Add SOS markers
  alerts
    .filter((a) => a.status !== "resolved")
    .forEach((alert) => {
      markers.push({
        id: alert.id,
        type: "sos",
        coordinates: alert.coordinates,
        label: alert.id,
        status: alert.threatLevel,
      })
    })

  // Add police unit markers
  units
    .filter((u) => u.status !== "offline")
    .forEach((unit) => {
      markers.push({
        id: unit.id,
        type: "police",
        coordinates: unit.coordinates,
        label: unit.callSign,
        status: unit.status,
      })
    })

  // Add static hospital markers
  markers.push(
    {
      id: "hospital-1",
      type: "hospital",
      coordinates: { lat: 40.7639, lng: -73.9529 },
      label: "NYC Health + Hospitals",
    },
    {
      id: "hospital-2",
      type: "hospital",
      coordinates: { lat: 40.7410, lng: -73.9897 },
      label: "Bellevue Hospital",
    }
  )

  // Add safe zone markers
  markers.push(
    {
      id: "safe-1",
      type: "safe_zone",
      coordinates: { lat: 40.7527, lng: -73.9772 },
      label: "Grand Central Safe Zone",
    },
    {
      id: "safe-2",
      type: "safe_zone",
      coordinates: { lat: 40.7506, lng: -73.9971 },
      label: "Penn Station Safe Zone",
    }
  )

  return markers
}
