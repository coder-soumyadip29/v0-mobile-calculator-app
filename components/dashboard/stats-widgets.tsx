"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  AlertCircle,
  Shield,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StatWidget {
  label: string
  value: number
  suffix?: string
  icon: React.ReactNode
  trend?: { value: number; positive: boolean }
  color: string
  bgColor: string
}

interface StatsWidgetsProps {
  totalActive: number
  criticalCases: number
  availableUnits: number
  resolvedToday: number
  avgResponseTime: number
  highRiskAlerts: number
}

function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number
  suffix?: string
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1000
    const steps = 30
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return (
    <span>
      {displayValue}
      {suffix}
    </span>
  )
}

export function StatsWidgets({
  totalActive,
  criticalCases,
  availableUnits,
  resolvedToday,
  avgResponseTime,
  highRiskAlerts,
}: StatsWidgetsProps) {
  const stats: StatWidget[] = [
    {
      label: "Active SOS",
      value: totalActive,
      icon: <AlertCircle className="w-5 h-5" />,
      trend: { value: 12, positive: false },
      color: "text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Critical Cases",
      value: criticalCases,
      icon: <AlertTriangle className="w-5 h-5" />,
      trend: { value: 3, positive: false },
      color: "text-red-400",
      bgColor: "bg-red-500/10 border-red-500/20",
    },
    {
      label: "Available Units",
      value: availableUnits,
      icon: <Shield className="w-5 h-5" />,
      trend: { value: 2, positive: true },
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Resolved Today",
      value: resolvedToday,
      icon: <CheckCircle className="w-5 h-5" />,
      trend: { value: 8, positive: true },
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Avg Response",
      value: avgResponseTime,
      suffix: "m",
      icon: <Clock className="w-5 h-5" />,
      trend: { value: 15, positive: true },
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10 border-yellow-500/20",
    },
    {
      label: "High-Risk Zones",
      value: highRiskAlerts,
      icon: <Users className="w-5 h-5" />,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10 border-orange-500/20",
    },
  ]

  return (
    <div className="grid grid-cols-6 gap-4 p-4 border-b border-border bg-card/50">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={cn(
            "p-4 rounded-lg border",
            stat.bgColor,
            "transition-all duration-200 hover:scale-[1.02]"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={stat.color}>{stat.icon}</span>
            {stat.trend && (
              <div
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  stat.trend.positive ? "text-emerald-400" : "text-red-400"
                )}
              >
                {stat.trend.positive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{stat.trend.value}%</span>
              </div>
            )}
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            <AnimatedCounter value={stat.value} suffix={stat.suffix} />
          </div>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  )
}
