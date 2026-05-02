"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Bell,
  Radio,
  Shield,
  AlertTriangle,
  Activity,
  User,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardHeader() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [notifications, setNotifications] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6">
      {/* Left Section - Logo & Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              Emergency Rescue Command Center
            </h1>
            <p className="text-xs text-muted-foreground">
              NYPD Emergency Response Division
            </p>
          </div>
        </div>
      </div>

      {/* Center Section - Date & Time */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">{formatDate(currentTime)}</p>
          <p className="text-xl font-mono font-semibold text-foreground tracking-wider">
            {formatTime(currentTime)}
          </p>
        </div>
      </div>

      {/* Right Section - Status & Profile */}
      <div className="flex items-center gap-4">
        {/* System Health */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">
            System Online
          </span>
        </div>

        {/* Radio Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Radio className="w-4 h-4 text-primary" />
          </motion.div>
          <span className="text-xs font-medium text-primary">Radio Active</span>
        </div>

        {/* Emergency Alert Button */}
        <Button
          variant="destructive"
          size="sm"
          className="gap-2 bg-red-600 hover:bg-red-700"
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="hidden lg:inline">Panic Mode</span>
        </Button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {notifications > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center"
            >
              {notifications}
            </motion.span>
          )}
        </button>

        {/* Profile */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left hidden lg:block">
            <p className="text-sm font-medium text-foreground">Cpt. Johnson</p>
            <p className="text-xs text-muted-foreground">Dispatch Lead</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  )
}
