"use client";

import { useState, useRef, DragEvent, useEffect } from "react";
import { Upload, FileVideo, X, ChevronUp, ChevronDown, Sparkles, Brain } from "lucide-react";

interface ReelPipelineUploaderProps {
  onUpload: (files: File[]) => void;
}

const MAX_SIZE_MB = 100;
const MAX_TOTAL_MB = 500;
const MAX_TOTAL_DURATION_SEC = 300; // 5 minutes
const ALLOWED = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];

interface FileItem { file: File; preview: string; }

export default function ReelPipelineUploader({ onUpload }: ReelPipelineUploaderProps) {
  const [files, setFiles]           = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  const validate = (newFiles: File[], existingFiles: FileItem[] = []): string | null => {
    const allFiles = [...existingFiles.map(f => f.file), ...newFiles];
    const totalMB = allFiles.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
    if (totalMB > MAX_TOTAL_MB) return `Total size must be under ${MAX_TOTAL_MB}MB (current: ${totalMB.toFixed(1)}MB)`;
    for (const f of newFiles) {
      if (!ALLOWED.includes(f.type)) return `Invalid type: ${f.name}`;
      if (f.size > MAX_SIZE_MB * 1024 * 1024) return `Too large: ${f.name} (max ${MAX_SIZE_MB}MB)`;
    }
    return null;
  };

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const err = validate(arr, files);
    if (err) { setError(err); return; }
    setError(null);
    setFiles(prev => [...prev, ...arr.map(f => ({ file: f, preview: URL.createObjectURL(f) }))]);
  };

  const remove = (i: number) => {
    setFiles(prev => { const n = [...prev]; URL.revokeObjectURL(n[i].preview); n.splice(i, 1); return n; });
  };

  const move = (i: number, dir: "up" | "down") => {
    setFiles(prev => {
      const n = [...prev], j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= n.length) return prev;
      [n[i], n[j]] = [n[j], n[i]]; return n;
    });
  };

  return (
    <div className="space-y-8">

      {/* AI badge */}
      <div className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl
                      bg-gradient-to-r from-purple-500/10 to-pink-500/10
                      border border-purple-500/20 mx-auto w-fit">
        <Brain className="w-5 h-5 text-purple-400" />
        <span className="text-sm font-medium text-purple-300">
          AI decides everything — style, pacing, music, order
        </span>
      </div>

      {/* Drop zone */}
      {files.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
          onDrop={e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files); }}
          className={`border-2 border-dashed rounded-2xl p-14 cursor-pointer text-center transition-all
            ${isDragging ? "border-purple-500 bg-purple-500/5" : "border-gray-700 hover:border-purple-500"}`}
        >
          <input ref={inputRef} type="file" accept="video/*" multiple className="hidden"
            onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }} />
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20
                          flex items-center justify-center mx-auto mb-6">
            <Upload className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Drop your raw clips here</h3>
          <p className="text-gray-400 mb-5">AI will watch them, plan the edit, find music, and build your reel</p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><FileVideo className="w-4 h-4" />MP4, MOV, WebM</span>
            <span>•</span><span>Max {MAX_SIZE_MB}MB each</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{files.length} clip{files.length > 1 ? "s" : ""} queued</p>
            <button onClick={() => inputRef.current?.click()}
              className="text-sm text-purple-400 hover:text-purple-300">+ Add more</button>
          </div>
          <input ref={inputRef} type="file" accept="video/*" multiple className="hidden"
            onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }} />
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {files.map((item, i) => (
              <div key={`${item.file.name}-${i}`}
                className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => move(i, "up")} disabled={i === 0}
                    className="p-0.5 text-gray-500 hover:text-white disabled:opacity-20">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => move(i, "down")} disabled={i === files.length - 1}
                    className="p-0.5 text-gray-500 hover:text-white disabled:opacity-20">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-16 h-10 rounded-lg overflow-hidden bg-black/50 flex-shrink-0">
                  <video src={item.preview} className="w-full h-full object-cover" muted preload="metadata" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate text-sm">{item.file.name}</p>
                  <p className="text-xs text-gray-500">{(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button onClick={() => remove(i)} className="p-2 text-gray-400 hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 rounded-lg p-3 text-sm">
          <span>⚠️</span><p>{error}</p>
        </div>
      )}

      {/* What AI will do */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { emoji: "👁️", label: "Analyzes every clip", sub: "LLaVA vision model reads mood & energy" },
          { emoji: "🎬", label: "Plans the edit", sub: "Llama decides order, pacing & style" },
          { emoji: "🎵", label: "Finds real music", sub: "Downloads from Internet Archive (CC0)" },
          { emoji: "✂️", label: "Cuts the reel", sub: "FFmpeg trims silence, reframes, stitches" },
        ].map(f => (
          <div key={f.label} className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="text-2xl mb-2">{f.emoji}</div>
            <p className="text-white text-sm font-medium">{f.label}</p>
            <p className="text-gray-500 text-xs mt-1">{f.sub}</p>
          </div>
        ))}
      </div>

      {/* Submit */}
      {files.length > 0 && (
        <button onClick={handleSubmit} disabled={isSubmitting}
          className="w-full py-4 rounded-xl font-bold text-white text-lg
                     flex items-center justify-center gap-3
                     bg-gradient-to-r from-purple-600 to-pink-600
                     hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg
                     disabled:opacity-50 disabled:cursor-not-allowed">
          {isSubmitting ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Checking duration...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Let AI Build My Reel ({files.length} clip{files.length > 1 ? "s" : ""})
            </>
          )}
        </button>
      )}
    </div>
  );
}
