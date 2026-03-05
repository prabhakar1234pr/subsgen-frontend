"use client";

import { Download, RotateCcw, CheckCircle2, Copy, Check } from "lucide-react";
import { useState } from "react";

interface Caption { hook: string; body: string; cta: string; hashtags: string[]; }
interface VideoPreviewProps {
  videoUrl: string;
  onReset: () => void;
  isZip?: boolean;
  downloadName?: string;
  caption?: Caption | null;
  subtitleStyle?: string;
}

export default function VideoPreview({ videoUrl, onReset, isZip, downloadName, caption, subtitleStyle }: VideoPreviewProps) {
  const [copied, setCopied] = useState(false);
  const filename = downloadName ?? (isZip ? "subtitled_videos.zip" : "subtitled_video.mp4");
  const isReel   = filename === "reel.mp4";

  const hashtagsStr = caption?.hashtags
    ? (Array.isArray(caption.hashtags) ? caption.hashtags.join(" ") : String(caption.hashtags))
    : "";
  const fullCaption = caption
    ? `${caption.hook}\n\n${caption.body}\n\n${caption.cta}\n\n${hashtagsStr}`.trim()
    : null;

  const copyCaption = async () => {
    if (!fullCaption) return;
    await navigator.clipboard.writeText(fullCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (videoUrl.startsWith("blob:") || videoUrl.startsWith("/")) {
      const a = document.createElement("a");
      a.href = videoUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(videoUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* Success header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-1">
          {isReel ? "Your AI reel is ready! 🎬" : isZip ? "Your videos are ready!" : "Your video is ready!"}
        </h3>
        {subtitleStyle && (
          <p className="text-sm text-gray-500">AI chose subtitle style: <span className="text-orange-400 font-medium capitalize">{subtitleStyle}</span></p>
        )}
      </div>

      {/* Video player */}
      {!isZip && (
        <div className="relative rounded-2xl overflow-hidden bg-black/50 ring-1 ring-white/10">
          <video src={videoUrl} controls autoPlay className="w-full max-h-[500px] object-contain" />
        </div>
      )}

      {/* AI-generated caption */}
      {caption && (
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-5
                        border border-purple-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-white flex items-center gap-2">
              🤖 AI-Generated Caption
            </h4>
            <button onClick={copyCaption}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
                         bg-white/10 hover:bg-white/20 text-gray-300 transition-colors">
              {copied ? <><Check className="w-3 h-3 text-green-400" />Copied!</> : <><Copy className="w-3 h-3" />Copy all</>}
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-white font-semibold">{caption.hook}</p>
            <p className="text-gray-300 whitespace-pre-line">{caption.body}</p>
            <p className="text-orange-400">{caption.cta}</p>
            <p className="text-purple-400 text-xs">{hashtagsStr}</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={handleDownload}
          className="flex-1 btn-primary py-4 rounded-xl font-semibold text-white text-lg
                     flex items-center justify-center gap-2">
          <Download className="w-5 h-5" />
          {isZip ? "Download ZIP" : isReel ? "Download Reel" : "Download Video"}
        </button>
        <button onClick={onReset}
          className="flex-1 py-4 rounded-xl font-semibold text-white text-lg
                     flex items-center justify-center gap-2
                     bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
          <RotateCcw className="w-5 h-5" /> Make Another
        </button>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-xl p-5 border border-orange-500/20">
        <h4 className="font-semibold text-white mb-3">📱 Pro Tips</h4>
        <ul className="space-y-1.5 text-sm text-gray-300">
          <li>• Post during peak hours (9AM, 12PM, 7PM) for max reach</li>
          <li>• Paste the AI caption above directly into Instagram</li>
          <li>• Reply to every comment in the first hour</li>
          <li>• Pin your best comment after posting</li>
        </ul>
      </div>
    </div>
  );
}
