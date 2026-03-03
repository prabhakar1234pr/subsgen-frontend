"use client";

import { Loader2, X } from "lucide-react";

interface ProcessingStatusProps {
  progress: number;
  message: string;
  onCancel: () => void;
  steps?: string[];
}

const DEFAULT_STEPS = [
  "Upload video", "Extract audio", "Transcribe speech",
  "Generate subtitles", "Burn onto video",
];

export default function ProcessingStatus({ progress, message, onCancel, steps }: ProcessingStatusProps) {
  const displaySteps = steps ?? DEFAULT_STEPS;
  const stepPct = 100 / displaySteps.length;

  return (
    <div className="py-12 text-center">
      <div className="relative w-24 h-24 mx-auto mb-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 animate-pulse-slow" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-orange-500/10 to-pink-500/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-white mb-2 processing-pulse">{message}</h3>
      <p className="text-gray-400 mb-8">This may take a couple of minutes</p>

      <div className="max-w-md mx-auto mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Progress</span>
          <span className="text-orange-400 font-medium">{progress}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full progress-bar rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="max-w-sm mx-auto space-y-2 text-left mb-8">
        {displaySteps.map((label, i) => {
          const stepThreshold = (i + 1) * stepPct;
          const completed = progress >= stepThreshold;
          const active = !completed && progress >= i * stepPct;
          return (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                font-medium transition-all flex-shrink-0
                ${completed ? "bg-green-500 text-white"
                  : active ? "bg-orange-500 text-white animate-pulse"
                  : "bg-white/10 text-gray-500"}`}>
                {completed ? "✓" : active ? "•" : "○"}
              </div>
              <span className={`text-sm ${completed ? "text-green-400" : active ? "text-white" : "text-gray-500"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <button onClick={onCancel}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
        <X className="w-4 h-4" /> Cancel
      </button>
    </div>
  );
}
