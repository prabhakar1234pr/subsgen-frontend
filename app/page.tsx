"use client";

import { useState } from "react";
import VideoUploader from "@/components/VideoUploader";
import ProcessingStatus from "@/components/ProcessingStatus";
import VideoPreview from "@/components/VideoPreview";
import { Sparkles, Zap, Film } from "lucide-react";

type AppState = "idle" | "uploading" | "processing" | "complete" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860";

  const handleUpload = async (file: File, style: string) => {
    setState("uploading");
    setProgress(0);
    setStatusMessage("Uploading video...");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("style", style);

      setState("processing");
      setProgress(20);
      setStatusMessage("Extracting audio...");

      // Simulate progress updates (actual processing happens server-side)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          const messages = [
            "Extracting audio...",
            "Transcribing speech...",
            "Generating subtitles...",
            "Burning subtitles...",
          ];
          const idx = Math.floor((prev - 20) / 17.5);
          setStatusMessage(messages[Math.min(idx, messages.length - 1)]);
          return prev + 5;
        });
      }, 2000);

      const response = await fetch(`${API_URL}/api/process`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Processing failed");
      }

      // Get the video blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setProgress(100);
      setStatusMessage("Complete!");
      setResultUrl(url);
      setState("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setState("error");
    }
  };

  const handleReset = () => {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }
    setState("idle");
    setProgress(0);
    setStatusMessage("");
    setResultUrl(null);
    setError(null);
  };

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Film className="w-10 h-10 text-orange-500" />
            <h1 className="text-4xl sm:text-5xl font-bold gradient-text">
              SubsGen
            </h1>
          </div>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Generate viral Instagram-style subtitles for your talking head videos.
            <span className="text-orange-400"> 100% Free</span> • English Only • No watermarks
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="glass-card rounded-2xl p-6 text-center">
            <Sparkles className="w-8 h-8 text-pink-500 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-1">Word Highlighting</h3>
            <p className="text-sm text-gray-500">Hormozi-style word-by-word pop</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <Zap className="w-8 h-8 text-orange-500 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-1">AI Transcription</h3>
            <p className="text-sm text-gray-500">Powered by OpenAI Whisper</p>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <Film className="w-8 h-8 text-violet-500 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-1">Burned-In Subs</h3>
            <p className="text-sm text-gray-500">Ready to post, no editing needed</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="glass-card rounded-3xl p-8 sm:p-12">
          {state === "idle" && <VideoUploader onUpload={handleUpload} />}

          {(state === "uploading" || state === "processing") && (
            <ProcessingStatus
              progress={progress}
              message={statusMessage}
              onCancel={handleReset}
            />
          )}

          {state === "complete" && resultUrl && (
            <VideoPreview videoUrl={resultUrl} onReset={handleReset} />
          )}

          {state === "error" && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">❌</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Something went wrong
              </h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={handleReset}
                className="btn-primary px-8 py-3 rounded-full font-semibold text-white"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-8">
          Built with Whisper AI + FFmpeg • Completely free, no sign-up required
        </p>
      </div>
    </main>
  );
}

