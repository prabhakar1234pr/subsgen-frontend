"use client";

import { useState } from "react";
import VideoUploader from "@/components/VideoUploader";
import ReelPipelineUploader from "@/components/ReelPipelineUploader";
import ProcessingStatus from "@/components/ProcessingStatus";
import VideoPreview from "@/components/VideoPreview";
import { processVideo, processVideos, processReelPipeline } from "@/lib/api";
import { Film, Zap, Brain } from "lucide-react";

type AppState = "idle" | "processing" | "complete" | "error";
type Mode = "subtitles" | "reel";

const REEL_STEPS = [
  "Save uploads",
  "Transcribe clips (Whisper v3)",
  "Analyze visuals (LLaMA 4 Scout)",
  "Brain: narrative + edit plan",
  "Brain: caption + hashtags",
  "Find & download music",
  "Precise trim each clip",
  "Reframe to 9:16",
  "Stitch with crossfades",
  "Mix music",
  "Burn subtitles",
];

type Caption = { hook: string; body: string; cta: string; hashtags: string[] };

export default function Home() {
  const [mode, setMode]                 = useState<Mode>("reel");
  const [state, setState]               = useState<AppState>("idle");
  const [progress, setProgress]         = useState(0);
  const [statusMsg, setStatusMsg]       = useState("");
  const [resultUrl, setResultUrl]       = useState<string | null>(null);
  const [isZip, setIsZip]               = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [caption, setCaption]           = useState<Caption | null>(null);
  const [subtitleStyle, setSubtitleStyle] = useState<string>("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860";

  const handleSubtitlesUpload = async (files: File[], style: string) => {
    setState("processing"); setProgress(10); setStatusMsg("Uploading..."); setError(null);
    setIsZip(files.length > 1); setCaption(null);
    const steps = ["Uploading...", "Extracting audio...", "Transcribing...", "Generating subs...", "Burning subs..."];
    let si = 0;
    const tick = setInterval(() => {
      setProgress(p => p >= 90 ? (clearInterval(tick), p) : p + 5);
      setStatusMsg(steps[Math.min(si++, steps.length - 1)]);
    }, 2000);
    try {
      const blob = files.length === 1
        ? await processVideo(files[0], style, API_URL)
        : await processVideos(files, style, API_URL);
      clearInterval(tick);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100); setStatusMsg("Done!"); setState("complete");
    } catch (e) {
      clearInterval(tick);
      setError(e instanceof Error ? e.message : "Error"); setState("error");
    }
  };

  const handleReelPipeline = async (files: File[]) => {
    setState("processing"); setProgress(3); setError(null); setIsZip(false);
    setCaption(null); setSubtitleStyle("");

    const stepMsgs = [
      { at: 3,  msg: "Saving uploads..." },
      { at: 10, msg: "Transcribing clips with Whisper Large v3..." },
      { at: 24, msg: "Analyzing visuals with Llama 4 Scout..." },
      { at: 36, msg: "Brain planning narrative + edit order..." },
      { at: 46, msg: "Brain writing caption + hashtags..." },
      { at: 54, msg: "Finding & downloading music..." },
      { at: 62, msg: "Precisely trimming each clip..." },
      { at: 70, msg: "Reframing clips to 9:16..." },
      { at: 77, msg: "Stitching with crossfades..." },
      { at: 84, msg: "Mixing music..." },
      { at: 91, msg: "Burning subtitles..." },
    ];
    let si = 0;
    const tick = setInterval(() => {
      if (si < stepMsgs.length) { setProgress(stepMsgs[si].at); setStatusMsg(stepMsgs[si].msg); si++; }
    }, 5000);

    try {
      const result = await processReelPipeline(files, API_URL);
      clearInterval(tick);
      setResultUrl(URL.createObjectURL(result.blob));
      setCaption(result.caption);
      setSubtitleStyle(result.subtitleStyle);
      setProgress(100); setStatusMsg("AI reel ready! 🎬"); setState("complete");
    } catch (e) {
      clearInterval(tick);
      setError(e instanceof Error ? e.message : "Pipeline failed"); setState("error");
    }
  };

  const handleReset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setState("idle"); setProgress(0); setStatusMsg("");
    setResultUrl(null); setIsZip(false); setError(null);
    setCaption(null); setSubtitleStyle("");
  };

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Film className="w-10 h-10 text-orange-500" />
            <h1 className="text-4xl sm:text-5xl font-bold gradient-text">SubsGen</h1>
          </div>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Add viral subtitles — or let AI build a complete reel from raw clips.
          </p>
        </div>

        {state === "idle" && (
          <div className="flex rounded-2xl bg-white/5 p-1 mb-8 border border-white/10">
            <button onClick={() => setMode("subtitles")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                font-semibold transition-all text-sm sm:text-base
                ${mode === "subtitles" ? "bg-orange-500 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}>
              <Zap className="w-4 h-4" /> Subtitles Only
            </button>
            <button onClick={() => setMode("reel")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                font-semibold transition-all text-sm sm:text-base
                ${mode === "reel"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"}`}>
              <Brain className="w-4 h-4" /> AI Reel Pipeline ✨
            </button>
          </div>
        )}

        <div className="glass-card rounded-3xl p-8 sm:p-12">
          {state === "idle" && mode === "subtitles" && <VideoUploader onUpload={handleSubtitlesUpload} />}
          {state === "idle" && mode === "reel"      && <ReelPipelineUploader onUpload={handleReelPipeline} />}

          {state === "processing" && (
            <ProcessingStatus
              progress={progress} message={statusMsg} onCancel={handleReset}
              steps={mode === "reel" ? REEL_STEPS : undefined}
            />
          )}

          {state === "complete" && resultUrl && (
            <VideoPreview
              videoUrl={resultUrl} onReset={handleReset} isZip={isZip}
              downloadName={mode === "reel" ? "reel.mp4" : undefined}
              caption={caption}
              subtitleStyle={subtitleStyle}
            />
          )}

          {state === "error" && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">❌</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Something went wrong</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <button onClick={handleReset} className="btn-primary px-8 py-3 rounded-full font-semibold text-white">
                Try Again
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 text-sm mt-8">
          Whisper v3 + Llama 4 Scout + Llama 3.3 70B (Groq) + Internet Archive + FFmpeg
        </p>
      </div>
    </main>
  );
}
