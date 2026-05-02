"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Search, Filter, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCard } from "./alert-card"
import { EmergencyAlert, ThreatLevel, AlertStatus } from "@/lib/emergency-data"
import { cn } from "@/lib/utils"

interface SOSSidebarProps {
  alerts: EmergencyAlert[]
  onAlertSelect?: (alert: EmergencyAlert) => void
  selectedAlertId?: string
}

export function SOSSidebar({
  alerts,
  onAlertSelect,
  selectedAlertId,
}: SOSSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [threatFilter, setThreatFilter] = useState<ThreatLevel | "all">("all")
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "all">("all")

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.callerName?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false)

    const matchesThreat =
      threatFilter === "all" || alert.threatLevel === threatFilter
    const matchesStatus =
      statusFilter === "all" || alert.status === statusFilter

    return matchesSearch && matchesThreat && matchesStatus
  })

  const criticalCount = alerts.filter(
    (a) => a.threatLevel === "critical" && a.status !== "resolved"
  ).length

  return (
    <aside className="w-96 border-r border-border bg-sidebar flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: criticalCount > 0 ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <AlertTriangle
                className={cn(
                  "w-5 h-5",
                  criticalCount > 0 ? "text-red-500" : "text-primary"
                )}
              />
            </motion.div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Incoming SOS Feed
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
            {filteredAlerts.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-sidebar-accent border-sidebar-border"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between"
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              filterOpen && "rotate-180"
            )}
          />
        </Button>

        {/* Filter Options */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-3">
                {/* Threat Level Filter */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Threat Level
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      ["all", "critical", "high", "medium", "low"] as const
                    ).map((level) => (
                      <button
                        key={level}
                        onClick={() => setThreatFilter(level)}
                        className={cn(
                          "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                          threatFilter === level
                            ? "bg-primary text-primary-foreground"
                            : "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80"
                        )}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      ["all", "pending", "assigned", "resolved"] as const
                    ).map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={cn(
                          "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                          statusFilter === status
                            ? "bg-primary text-primary-foreground"
                            : "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80"
                        )}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onAlertSelect?.(alert)}
              className={cn(
                "transition-all",
                selectedAlertId === alert.id && "ring-2 ring-primary rounded-lg"
              )}
            >
              <AlertCard
                alert={alert}
                isNew={index === 0 && alert.status === "pending"}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAlerts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No alerts match your filters</p>
          </div>
        )}
      </div>
    </aside>
  )
}
