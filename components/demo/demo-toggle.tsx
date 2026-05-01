"use client"

import { cn } from "@/lib/utils"
import { Smartphone, Monitor, RotateCcw } from "lucide-react"
import { useDistress } from "@/lib/distress-context"

type ViewMode = "victim" | "police"

interface DemoToggleProps {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
}

export function DemoToggle({ view, onViewChange }: DemoToggleProps) {
  const { isDistressActive, resetDistress } = useDistress()

  return (
    <div className="h-10 bg-slate-950 border-b border-slate-800 flex items-center justify-center gap-6 px-4 shrink-0">
      <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
        Developer Demo Toggle
      </span>

      <div className="flex items-center bg-slate-900 rounded-lg p-1 gap-1">
        <button
          type="button"
          onClick={() => onViewChange("victim")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
            view === "victim"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-300"
          )}
        >
          <Smartphone className="w-4 h-4" />
          Victim App (Mobile)
        </button>
        <button
          type="button"
          onClick={() => onViewChange("police")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
            view === "police"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-300"
          )}
        >
          <Monitor className="w-4 h-4" />
          Police Dashboard (Desktop)
        </button>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Distress:</span>
          <span
            className={cn(
              "text-xs font-mono px-2 py-0.5 rounded",
              isDistressActive
                ? "bg-red-500/20 text-red-400"
                : "bg-slate-800 text-slate-500"
            )}
          >
            {isDistressActive ? "ACTIVE" : "inactive"}
          </span>
        </div>

        {isDistressActive && (
          <button
            type="button"
            onClick={resetDistress}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
