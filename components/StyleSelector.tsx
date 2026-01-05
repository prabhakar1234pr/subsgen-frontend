"use client";

import { Check } from "lucide-react";

export interface SubtitleStyle {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    highlight: string;
    bg: string;
  };
}

export const SUBTITLE_STYLES: SubtitleStyle[] = [
  {
    id: "hormozi",
    name: "Hormozi",
    description: "Bold yellow highlights",
    preview: "WORD BY WORD",
    colors: {
      primary: "#FFFFFF",
      highlight: "#FFFF00",
      bg: "#000000",
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean white text",
    preview: "Simple & Clean",
    colors: {
      primary: "#FFFFFF",
      highlight: "#FFFFFF",
      bg: "transparent",
    },
  },
  {
    id: "neon",
    name: "Neon Glow",
    description: "Glowing cyan effect",
    preview: "NEON VIBES",
    colors: {
      primary: "#00FFFF",
      highlight: "#FF00FF",
      bg: "#000000",
    },
  },
  {
    id: "fire",
    name: "Fire",
    description: "Orange & red energy",
    preview: "ON FIRE",
    colors: {
      primary: "#FFFFFF",
      highlight: "#FF6600",
      bg: "#000000",
    },
  },
  {
    id: "karaoke",
    name: "Karaoke",
    description: "Green highlights",
    preview: "SING ALONG",
    colors: {
      primary: "#FFFFFF",
      highlight: "#00FF00",
      bg: "#000000",
    },
  },
  {
    id: "purple",
    name: "Purple Vibes",
    description: "Trendy purple style",
    preview: "AESTHETIC",
    colors: {
      primary: "#FFFFFF",
      highlight: "#A855F7",
      bg: "#000000",
    },
  },
];

interface StyleSelectorProps {
  selectedStyle: string;
  onSelectStyle: (styleId: string) => void;
}

export default function StyleSelector({
  selectedStyle,
  onSelectStyle,
}: StyleSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Choose Subtitle Style</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SUBTITLE_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelectStyle(style.id)}
            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
              selectedStyle === style.id
                ? "border-orange-500 bg-orange-500/10"
                : "border-white/10 hover:border-white/30 bg-white/5"
            }`}
          >
            {/* Selected indicator */}
            {selectedStyle === style.id && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            {/* Preview */}
            <div
              className="h-12 rounded-lg flex items-center justify-center mb-3 text-sm font-bold"
              style={{
                backgroundColor: style.colors.bg,
                color: style.colors.highlight,
                textShadow:
                  style.id === "neon"
                    ? `0 0 10px ${style.colors.highlight}`
                    : "2px 2px 4px rgba(0,0,0,0.8)",
              }}
            >
              {style.preview}
            </div>

            {/* Info */}
            <p className="font-medium text-white text-sm">{style.name}</p>
            <p className="text-xs text-gray-500">{style.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

