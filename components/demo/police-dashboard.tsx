"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });
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
  Battery,
  BatteryCharging,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  subscribeToAlerts,
  fetchAllHistoricalAlerts,
  type SOSAlert,
} from "@/lib/firebase";
import {
  RESPONDERS,
  calculateNearestResponder,
  type Responder,
} from "@/lib/responders";

function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time only on client to avoid hydration mismatch
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="font-mono text-sm text-slate-300">
      {time ? time.toLocaleTimeString("en-US", { hour12: false }) : "--:--:--"}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = "text-blue-400",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4 flex items-center gap-4">
      <div className={cn("p-2 rounded-lg bg-slate-700/50", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xl font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

function AlertCard({
  alert,
  isNew = false,
}: {
  alert: {
    id: string;
    type: string;
    location: string;
    time: string;
    status: string;
    priority: "critical" | "high" | "medium";
    hasAudio?: boolean;
    hasLiveTracking?: boolean;
    evidenceImages?: string[];
  };
  isNew?: boolean;
}) {
  const priorityStyles = {
    critical: "border-red-500/50 bg-red-500/10",
    high: "border-orange-500/50 bg-orange-500/10",
    medium: "border-yellow-500/50 bg-yellow-500/10",
  };

  const priorityBadge = {
    critical: "bg-red-500 text-white",
    high: "bg-orange-500 text-white",
    medium: "bg-yellow-500 text-black",
  };

  return (
    <motion.div
      initial={isNew ? { x: -50, opacity: 0 } : false}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "border rounded-lg p-4 transition-all",
        priorityStyles[alert.priority],
        isNew && "ring-2 ring-red-500 animate-pulse",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium uppercase",
                priorityBadge[alert.priority],
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
                <span className="text-xs font-medium">
                  LIVE TRACKING ACTIVE
                </span>
              </span>
            )}
          </p>
        </div>
        <span
          className={cn(
            "text-xs px-2 py-1 rounded",
            alert.status === "active"
              ? "bg-red-500/20 text-red-400"
              : "bg-green-500/20 text-green-400",
          )}
        >
          {alert.status}
        </span>
      </div>
      {/* Visual Evidence Section */}
      {alert.evidenceImages && alert.evidenceImages.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
            Visual Evidence Sequence
          </span>
          <div
            className={cn(
              "grid gap-2",
              alert.evidenceImages.length === 1
                ? "grid-cols-1"
                : alert.evidenceImages.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3",
            )}
          >
            {alert.evidenceImages.map((imgSrc, idx) => (
              <img
                key={idx}
                src={imgSrc}
                alt={`Captured Evidence ${idx + 1}`}
                className="w-full h-auto rounded-md border border-slate-700 shadow-sm object-cover aspect-video"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function formatAlertTime(timestamp?: string) {
  if (!timestamp) return "Just now";
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return "Just now";

  const diffMs = Date.now() - parsed.getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSeconds < 30) return "Just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getAlertSortTime(alert: { timestamp?: string }) {
  if (!alert.timestamp) return 0;
  const parsed = new Date(alert.timestamp).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function PoliceDashboard() {
  const enableLiveAlerts =
    process.env.NEXT_PUBLIC_ENABLE_LIVE_ALERTS === "true";
  const [showFlash, setShowFlash] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [historicalCoords, setHistoricalCoords] = useState<
    [number, number, number][]
  >([]);
  const [firebaseAlerts, setFirebaseAlerts] = useState<SOSAlert[]>([]);
  const [localAlerts, setLocalAlerts] = useState(
    [] as {
      id: string;
      type: string;
      location: string;
      timestamp?: string;
      time: string;
      status: string;
      priority: "critical" | "high" | "medium";
      hasAudio?: boolean;
      hasLiveTracking?: boolean;
      evidenceImages?: string[];
    }[],
  );
  const processedAlertIds = useRef<Set<string>>(new Set());
  const [currentSOSCoords, setCurrentSOSCoords] = useState<{
    lat: number | null;
    lng: number | null;
  } | null>(null);
  const [activeTranscript, setActiveTranscript] = useState<string>("");
  const [nearestResponderInfo, setNearestResponderInfo] = useState<{
    responder: Responder;
    distance: number;
  } | null>(null);

  // Calculate nearest responder when SOS coordinates change
  useEffect(() => {
    if (currentSOSCoords?.lat && currentSOSCoords?.lng) {
      const nearest = calculateNearestResponder(
        currentSOSCoords.lat,
        currentSOSCoords.lng,
        RESPONDERS,
      );
      setNearestResponderInfo(nearest);
    } else {
      setNearestResponderInfo(null);
    }
  }, [currentSOSCoords]);

  // Fetch historical data for heatmap
  useEffect(() => {
    if (showHeatmap && historicalCoords.length === 0) {
      fetchAllHistoricalAlerts().then((alerts) => {
        const coords: [number, number, number][] = alerts
          .filter((a) => a.latitude !== null && a.longitude !== null)
          .map((a) => [a.latitude!, a.longitude!, 1]);
        setHistoricalCoords(coords);
      });
    }
  }, [showHeatmap, historicalCoords.length]);

  // Subscribe to Firebase alerts
  useEffect(() => {
    if (!enableLiveAlerts) return;

    const unsubscribe = subscribeToAlerts((alerts) => {
      setFirebaseAlerts(alerts);

      // Always update transcript from the most recent active alert
      const activeAlert = alerts.find((a) => a.status === "active");
      if (activeAlert?.transcript) {
        setActiveTranscript(activeAlert.transcript);
      }

      // Always update coordinates from the most recent active alert (for live tracking)
      if (activeAlert?.latitude && activeAlert?.longitude) {
        setCurrentSOSCoords({
          lat: activeAlert.latitude,
          lng: activeAlert.longitude,
        });

        // Update the location string and image in localAlerts for this alert
        setLocalAlerts((prev) =>
          prev.map((localAlert) => {
            if (localAlert.id === activeAlert.id) {
              return {
                ...localAlert,
                location: `GPS: ${activeAlert.latitude!.toFixed(4)}° N, ${activeAlert.longitude!.toFixed(4)}° W`,
                evidenceImages:
                  activeAlert.evidenceImages || localAlert.evidenceImages,
              };
            }
            return localAlert;
          }),
        );
      }

      // Check for new alerts
      alerts.forEach((alert) => {
        if (alert.id && !processedAlertIds.current.has(alert.id)) {
          processedAlertIds.current.add(alert.id);

          // Flash effect for new alert
          setShowFlash(true);
          setTimeout(() => setShowFlash(false), 2000);

          // Update current SOS coordinates
          if (alert.latitude && alert.longitude) {
            setCurrentSOSCoords({ lat: alert.latitude, lng: alert.longitude });
          }

          // Update transcript from active alert
          if (alert.transcript) {
            setActiveTranscript(alert.transcript);
          }

          // Create formatted alert for local display
          const locationStr =
            alert.latitude && alert.longitude
              ? `GPS: ${alert.latitude.toFixed(4)}° N, ${alert.longitude.toFixed(4)}° W`
              : "GPS: Location unavailable";

          const formattedAlert = {
            id: alert.id,
            type: "URGENT: Stealth SOS - Live Audio & GPS Streaming",
            location: locationStr,
            timestamp: alert.timestamp,
            time: formatAlertTime(alert.timestamp),
            status: "active",
            priority: "critical" as const,
            hasAudio: true,
            hasLiveTracking: true,
            evidenceImages: alert.evidenceImages,
          };

          setLocalAlerts((prev) => [formattedAlert, ...prev]);
        }
      });
    });

    return () => unsubscribe();
  }, [enableLiveAlerts]);

  const sortedAlerts = [...localAlerts].sort(
    (a, b) => getAlertSortTime(b) - getAlertSortTime(a),
  );

  const hasActiveSOSAlert = localAlerts.some(
    (a) => a.priority === "critical" && a.status === "active",
  );
  const activeAlertData = enableLiveAlerts
    ? firebaseAlerts.find((a) => a.status === "active")
    : undefined;

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden relative">
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

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar - Live SOS Alerts */}
        <aside className="w-80 bg-slate-800/40 border-r border-slate-700/50 flex flex-col shrink-0 min-h-0">
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

          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {sortedAlerts.map((alert, i) => (
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

            {/* Dispatch Strategy Section */}
            <AnimatePresence>
              {hasActiveSOSAlert && nearestResponderInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border border-blue-500/30 rounded-lg overflow-hidden bg-slate-800/60"
                >
                  <div className="bg-blue-900/30 px-3 py-2 flex items-center gap-2 border-b border-blue-500/30">
                    <Navigation className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      Dispatch Strategy
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Nearest Unit:</span>
                      <span className="font-semibold text-white">
                        {nearestResponderInfo.responder.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Distance:</span>
                      <span className="font-semibold text-blue-400">
                        {nearestResponderInfo.distance.toFixed(2)} km
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded animate-pulse">
                        Dispatched
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Device Telemetry Section */}
            <AnimatePresence>
              {hasActiveSOSAlert &&
                activeAlertData &&
                activeAlertData.batteryLevel !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={cn(
                      "border rounded-lg overflow-hidden",
                      activeAlertData.batteryLevel < 0.05
                        ? "border-red-500 bg-red-900/30 animate-pulse"
                        : "border-slate-500/30 bg-slate-800/60",
                    )}
                  >
                    <div
                      className={cn(
                        "px-3 py-2 flex items-center gap-2 border-b",
                        activeAlertData.batteryLevel < 0.05
                          ? "bg-red-900/50 border-red-500/50"
                          : "bg-slate-900/30 border-slate-500/30",
                      )}
                    >
                      <Smartphone
                        className={cn(
                          "w-4 h-4",
                          activeAlertData.batteryLevel < 0.05
                            ? "text-red-400"
                            : "text-slate-400",
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs font-bold uppercase tracking-wider",
                          activeAlertData.batteryLevel < 0.05
                            ? "text-red-400"
                            : "text-slate-400",
                        )}
                      >
                        Device Telemetry
                      </span>
                    </div>
                    <div className="p-3 space-y-3 font-mono">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 flex items-center gap-2">
                          {activeAlertData.isCharging ? (
                            <BatteryCharging className="w-4 h-4 text-green-400" />
                          ) : activeAlertData.batteryLevel < 0.2 ? (
                            <Battery className="w-4 h-4 text-red-400" />
                          ) : (
                            <Battery className="w-4 h-4 text-green-400" />
                          )}
                          Battery:
                        </span>
                        <span
                          className={cn(
                            "font-semibold",
                            activeAlertData.batteryLevel < 0.2
                              ? "text-red-400"
                              : "text-green-400",
                          )}
                        >
                          {Math.round(activeAlertData.batteryLevel * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Wifi className="w-4 h-4 text-blue-400" />
                          Signal:
                        </span>
                        <span className="font-semibold text-blue-400 uppercase">
                          {activeAlertData.networkType || "Unknown"}
                        </span>
                      </div>

                      {activeAlertData.batteryLevel < 0.05 && (
                        <div className="mt-2 p-2 bg-red-500/20 border border-red-500 rounded text-red-400 text-[10px] uppercase font-bold text-center tracking-widest">
                          CRITICAL: VICTIM DEVICE DYING - LOCK LAST COORDINATES
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 flex flex-col overflow-hidden min-h-0">
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

          {/* Live Interactive Map */}
          <div className="flex-1 p-4 pt-0 min-h-0">
            <div className="h-full min-h-0 bg-slate-800/40 border border-slate-700/50 rounded-xl relative overflow-hidden">
              {/* Map header overlay */}
              <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2">
                <span className="px-3 py-1.5 bg-slate-900/80 rounded-lg text-sm text-white font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  Live Tactical Map
                </span>
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
                    showHeatmap
                      ? "bg-red-500/20 text-red-400 border border-red-500/50"
                      : "bg-slate-900/80 text-slate-300 hover:text-white",
                  )}
                >
                  🔥 Toggle Danger Heatmap
                </button>
              </div>

              {/* GPS Coordinates Display overlay */}
              {currentSOSCoords && (
                <div className="absolute top-4 right-4 z-[1000] px-3 py-1.5 bg-red-900/80 rounded-lg text-xs text-white font-mono">
                  LAT: {currentSOSCoords.lat?.toFixed(4) || "N/A"} | LNG:{" "}
                  {currentSOSCoords.lng?.toFixed(4) || "N/A"}
                </div>
              )}

              {/* Leaflet Map */}
              <LiveMap
                latitude={currentSOSCoords?.lat ?? 28.6139}
                longitude={currentSOSCoords?.lng ?? 77.209}
                responders={RESPONDERS}
                nearestResponder={nearestResponderInfo?.responder}
                showHeatmap={showHeatmap}
                historicalCoords={historicalCoords}
              />

              {/* Legend overlay */}
              <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-4 px-3 py-2 bg-slate-900/80 rounded-lg text-xs">
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
  );
}
