"use client"

import { DistressProvider } from "@/lib/distress-context"
import { VictimCalculator } from "./victim-calculator"
import { PoliceDashboard } from "./police-dashboard"

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative shrink-0">
      {/* Phone frame */}
      <div className="w-[320px] h-[650px] bg-slate-950 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800">
        {/* Inner screen with notch */}
        <div className="relative w-full h-full bg-black rounded-[32px] overflow-hidden">
          {/* Status bar / notch area */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-black z-10 flex items-center justify-center">
            <div className="w-24 h-5 bg-black rounded-b-2xl" />
          </div>
          {/* Calculator content */}
          <div className="pt-8 h-full relative">
            {children}
          </div>
        </div>
      </div>
      {/* Phone side buttons */}
      <div className="absolute -left-1 top-24 w-1 h-8 bg-slate-700 rounded-l" />
      <div className="absolute -left-1 top-36 w-1 h-12 bg-slate-700 rounded-l" />
      <div className="absolute -left-1 top-52 w-1 h-12 bg-slate-700 rounded-l" />
      <div className="absolute -right-1 top-32 w-1 h-16 bg-slate-700 rounded-r" />
    </div>
  )
}

function DemoContent() {
  return (
    <div className="h-screen flex bg-slate-950 overflow-hidden">
      {/* Left Side - Victim App (30%) */}
      <div className="w-[30%] min-w-[400px] flex flex-col bg-slate-900 border-r border-slate-700/50">
        {/* Header */}
        <div className="h-14 bg-slate-800/80 border-b border-slate-700/50 flex items-center px-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="font-semibold text-white text-sm">
              Victim Device Simulation
            </span>
          </div>
        </div>

        {/* Phone container */}
        <div className="flex-1 flex items-center justify-center p-6">
          <PhoneFrame>
            <VictimCalculator />
          </PhoneFrame>
        </div>

        {/* Instructions */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/40">
          <p className="text-sm text-slate-400 text-center">
            Enter <span className="font-mono text-red-400 font-semibold">9119</span> then press{" "}
            <span className="font-mono text-red-400 font-semibold">=</span> to trigger silent SOS
          </p>
          <p className="text-xs text-slate-500 mt-1 text-center">
            Long-press = (2s) or tap hidden corner also works
          </p>
        </div>
      </div>

      {/* Right Side - Police Dashboard (70%) */}
      <div className="flex-1 min-w-0">
        <PoliceDashboard />
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
