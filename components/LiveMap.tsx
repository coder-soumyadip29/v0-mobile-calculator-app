"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const redIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#EF4444"/>
        <circle cx="12" cy="12" r="5" fill="#fff"/>
      </svg>
    `),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
})

const blueIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#3B82F6"/>
        <circle cx="12" cy="12" r="5" fill="#fff"/>
      </svg>
    `),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
})

const greenIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#10B981"/>
        <circle cx="12" cy="12" r="5" fill="#fff"/>
      </svg>
    `),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
})

// ── Nominatim reverse geocoding with debounce ────────────────────────────
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
const GEOCODE_DEBOUNCE_MS = 800 // prevent API spam on rapid coordinate updates

import { type Responder } from "@/lib/responders"

interface LiveMapProps {
  latitude: number
  longitude: number
  responders?: Responder[]
  nearestResponder?: Responder | null
  showHeatmap?: boolean
  historicalCoords?: [number, number, number][]
}

export default function LiveMap({ latitude, longitude, responders, nearestResponder, showHeatmap, historicalCoords }: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)
  const respondersLayerRef = useRef<L.LayerGroup | null>(null)
  const heatLayerRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [address, setAddress] = useState("Fetching address...")

  // ── Initialize the map once the container div is mounted ───────────────
  useEffect(() => {
    // Guard: don't init if container is missing or map already exists
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 14,
      scrollWheelZoom: true,
      zoomControl: true,
    })

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map)

    const marker = L.marker([latitude, longitude], { icon: redIcon })
      .addTo(map)
      .bindPopup(buildPopupContent(latitude, longitude, "Fetching address..."))

    mapRef.current = map
    markerRef.current = marker
    setIsReady(true)

    // Ensure tiles render correctly after initial layout
    setTimeout(() => map.invalidateSize(), 100)

    // Cleanup: fully destroy the map instance on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
        polylineRef.current = null
        respondersLayerRef.current = null
        heatLayerRef.current = null
        setIsReady(false)
      }
    }
    // Only run on mount/unmount — coords are handled separately below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Draw responder markers ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !isReady || !responders) return

    if (!respondersLayerRef.current) {
      respondersLayerRef.current = L.layerGroup().addTo(mapRef.current)
    } else {
      respondersLayerRef.current.clearLayers()
    }

    responders.forEach((r) => {
      const icon = r.type === "police" ? blueIcon : greenIcon
      L.marker([r.latitude, r.longitude], { icon })
        .bindPopup(
          `<div style="font-family: sans-serif; padding: 4px;">
             <strong>${r.name}</strong><br/>
             <span style="color: #6b7280; font-size: 12px;">${r.type === 'police' ? 'Police Station' : 'Hospital'}</span>
           </div>`
        )
        .addTo(respondersLayerRef.current!)
    })
  }, [responders, isReady])

  // ── Update marker position, polyline and recenter when coordinates change ────────
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !isReady) return

    markerRef.current.setLatLng([latitude, longitude])
    markerRef.current.setPopupContent(
      buildPopupContent(latitude, longitude, address)
    )

    if (nearestResponder) {
      const lineCoords: L.LatLngTuple[] = [
        [latitude, longitude],
        [nearestResponder.latitude, nearestResponder.longitude],
      ]

      if (!polylineRef.current) {
        polylineRef.current = L.polyline(lineCoords, {
          color: "#ef4444",
          dashArray: "10, 10",
          weight: 3,
          opacity: 0.8,
        }).addTo(mapRef.current)
      } else {
        polylineRef.current.setLatLngs(lineCoords)
      }
    } else if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }

    mapRef.current.flyTo([latitude, longitude], mapRef.current.getZoom(), {
      duration: 1.5,
    })
  }, [latitude, longitude, address, nearestResponder, isReady])

  // ── Heatmap logic ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !isReady) return

    if (showHeatmap && historicalCoords && historicalCoords.length > 0) {
      require("leaflet.heat") // Dynamically load the plugin

      // Hide marker and polyline
      if (markerRef.current) markerRef.current.setOpacity(0)
      if (polylineRef.current) polylineRef.current.setStyle({ opacity: 0 })
      if (respondersLayerRef.current && mapRef.current.hasLayer(respondersLayerRef.current)) {
        mapRef.current.removeLayer(respondersLayerRef.current)
      }

      if (!heatLayerRef.current) {
        heatLayerRef.current = (L as any).heatLayer(historicalCoords, {
          radius: 25,
          blur: 15,
          maxZoom: 14,
          gradient: { 0.4: "blue", 0.6: "cyan", 0.7: "lime", 0.8: "yellow", 1.0: "red" },
        }).addTo(mapRef.current)
      } else {
        heatLayerRef.current.setLatLngs(historicalCoords)
        if (!mapRef.current.hasLayer(heatLayerRef.current)) {
          heatLayerRef.current.addTo(mapRef.current)
        }
      }
    } else {
      // Restore normal view
      if (markerRef.current) markerRef.current.setOpacity(1)
      if (polylineRef.current) polylineRef.current.setStyle({ opacity: 0.8 })
      if (respondersLayerRef.current && !mapRef.current.hasLayer(respondersLayerRef.current)) {
        respondersLayerRef.current.addTo(mapRef.current)
      }

      // Remove heatmap
      if (heatLayerRef.current && mapRef.current.hasLayer(heatLayerRef.current)) {
        mapRef.current.removeLayer(heatLayerRef.current)
      }
    }
  }, [showHeatmap, historicalCoords, isReady])

  // ── Reverse geocoding with debounce ────────────────────────────────────
  useEffect(() => {
    setAddress("Fetching address...")

    const controller = new AbortController()

    const timerId = setTimeout(async () => {
      try {
        const res = await fetch(
          `${NOMINATIM_URL}?format=json&lat=${latitude}&lon=${longitude}`,
          {
            signal: controller.signal,
            headers: {
              // Nominatim requires a valid User-Agent for their usage policy
              "Accept-Language": "en",
            },
          }
        )

        if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`)

        const data = await res.json()

        if (data?.display_name) {
          setAddress(data.display_name)
        } else {
          setAddress("Address unavailable")
        }
      } catch (err: any) {
        // Don't update state if the request was intentionally aborted
        if (err?.name === "AbortError") return
        console.warn("Reverse geocoding error:", err)
        setAddress("Address unavailable")
      }
    }, GEOCODE_DEBOUNCE_MS)

    // Cleanup: cancel pending fetch + timer if coords change before debounce fires
    return () => {
      clearTimeout(timerId)
      controller.abort()
    }
  }, [latitude, longitude])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px",
        borderRadius: "0.75rem",
        overflow: "hidden",
      }}
    />
  )
}

// ── Build styled popup HTML ──────────────────────────────────────────────
function buildPopupContent(lat: number, lng: number, address: string): string {
  const isLoading = address === "Fetching address..."
  const isFailed = address === "Address unavailable"

  return `
    <div style="
      font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
      min-width: 220px;
      max-width: 280px;
      padding: 2px;
    ">
      <!-- Header -->
      <div style="
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e5e7eb;
      ">
        <span style="font-size: 1.1em;">🚨</span>
        <span style="
          font-weight: 700;
          font-size: 0.9em;
          color: #dc2626;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        ">SOS Alert Location</span>
      </div>

      <!-- Address -->
      <div style="
        display: flex;
        align-items: flex-start;
        gap: 6px;
        margin-bottom: 8px;
      ">
        <span style="font-size: 0.95em; margin-top: 1px;">📍</span>
        <span style="
          font-size: 0.82em;
          color: ${isLoading ? "#9ca3af" : isFailed ? "#ef4444" : "#374151"};
          font-weight: ${isLoading ? "400" : "500"};
          line-height: 1.4;
          font-style: ${isLoading ? "italic" : "normal"};
        ">${address}</span>
      </div>

      <!-- Coordinates -->
      <div style="
        background: #f3f4f6;
        border-radius: 6px;
        padding: 6px 8px;
        display: flex;
        align-items: center;
        gap: 6px;
      ">
        <span style="font-size: 0.85em;">🧭</span>
        <span style="
          font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
          font-size: 0.75em;
          color: #6b7280;
          letter-spacing: 0.01em;
        ">${lat.toFixed(5)}°N, ${lng.toFixed(5)}°${lng >= 0 ? "E" : "W"}</span>
      </div>
    </div>
  `
}
