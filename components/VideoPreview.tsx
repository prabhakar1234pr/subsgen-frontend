"use client";

import { Download, RotateCcw, CheckCircle2 } from "lucide-react";

interface VideoPreviewProps {
  videoUrl: string;
  onReset: () => void;
}

export default function VideoPreview({ videoUrl, onReset }: VideoPreviewProps) {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = "subtitled_video.mp4";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Your video is ready!
        </h3>
        <p className="text-gray-400">
          Preview your video below, then download to share
        </p>
      </div>

      {/* Video Player */}
      <div className="relative rounded-2xl overflow-hidden bg-black/50 ring-1 ring-white/10">
        <video
          src={videoUrl}
          controls
          autoPlay
          className="w-full max-h-[500px] object-contain"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleDownload}
          className="flex-1 btn-primary py-4 rounded-xl font-semibold text-white text-lg flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download Video
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-4 rounded-xl font-semibold text-white text-lg flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
        >
          <RotateCcw className="w-5 h-5" />
          Process Another
        </button>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-xl p-6 border border-orange-500/20">
        <h4 className="font-semibold text-white mb-3">📱 Pro Tips</h4>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>• Post during peak hours (9AM, 12PM, 7PM) for maximum reach</li>
          <li>• Add trending audio to boost your video in the algorithm</li>
          <li>• Use 3-5 relevant hashtags in your caption</li>
          <li>• Hook viewers in the first 3 seconds!</li>
        </ul>
      </div>
    </div>
  );
}

