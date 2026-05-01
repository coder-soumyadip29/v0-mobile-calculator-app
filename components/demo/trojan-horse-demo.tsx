"use client"

import { useState } from "react"
import { DistressProvider } from "@/lib/distress-context"
import { DemoToggle } from "./demo-toggle"
import { VictimCalculator } from "./victim-calculator"
import { PoliceDashboard } from "./police-dashboard"

type ViewMode = "victim" | "police"

function DemoContent() {
  const [view, setView] = useState<ViewMode>("victim")

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      <DemoToggle view={view} onViewChange={setView} />

      <div className="flex-1 overflow-hidden">
        {view === "victim" ? (
          // Mobile phone container centered on screen
          <div className="h-full flex items-center justify-center p-8 bg-slate-900">
            <div className="relative">
              {/* Phone frame */}
              <div className="w-[320px] h-[650px] bg-slate-950 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800">
                {/* Inner screen with notch */}
                <div className="relative w-full h-full bg-black rounded-[32px] overflow-hidden">
                  {/* Status bar / notch area */}
                  <div className="absolute top-0 left-0 right-0 h-8 bg-black z-10 flex items-center justify-center">
                    <div className="w-24 h-5 bg-black rounded-b-2xl" />
                  </div>
                  {/* Calculator content */}
                  <div className="pt-8 h-full">
                    <VictimCalculator />
                  </div>
                </div>
              </div>
              {/* Phone side buttons */}
              <div className="absolute -left-1 top-24 w-1 h-8 bg-slate-700 rounded-l" />
              <div className="absolute -left-1 top-36 w-1 h-12 bg-slate-700 rounded-l" />
              <div className="absolute -left-1 top-52 w-1 h-12 bg-slate-700 rounded-l" />
              <div className="absolute -right-1 top-32 w-1 h-16 bg-slate-700 rounded-r" />
            </div>

            {/* Instructions */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
              <p className="text-sm text-slate-500">
                Type <span className="font-mono text-slate-400">9119 + 0 =</span>{" "}
                or tap the hidden corner button to trigger distress
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Long-press = (2s) also triggers distress mode
              </p>
            </div>
          </div>
        ) : (
          <PoliceDashboard />
        )}
      </div>
    </div>
  )
}

export function TrojanHorseDemo() {
  return (
    <DistressProvider>
      <DemoContent />
    </DistressProvider>
  )
}
