"use client";

import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import { Upload, FileVideo, AlertCircle, X, ChevronUp, ChevronDown } from "lucide-react";
import StyleSelector from "./StyleSelector";
import { saveVideo, getVideo, clearVideo } from "@/lib/videoStorage";

interface VideoUploaderProps {
  onUpload: (files: File[], style: string) => void;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB per file
const MAX_TOTAL_MB = 500;
const MAX_TOTAL_DURATION_SEC = 300; // 5 minutes
const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];

interface FileWithPreview {
  file: File;
  preview: string;
}

export default function VideoUploader({ onUpload }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [selectedStyle, setSelectedStyle] = useState("hormozi");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const restoreVideo = async () => {
      try {
        const stored = await getVideo();
        if (stored) {
          const url = URL.createObjectURL(stored.file);
          setSelectedFiles([{ file: stored.file, preview: url }]);
          setSelectedStyle(stored.style);
        }
      } catch (err) {
        console.error("Failed to restore video:", err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreVideo();
  }, []);

  useEffect(() => {
    if (selectedFiles.length === 1) {
      saveVideo(selectedFiles[0].file, selectedStyle);
    }
    // Don't persist when multiple files - restore would be incomplete
  }, [selectedFiles, selectedStyle]);

  const filesRef = useRef(selectedFiles);
  filesRef.current = selectedFiles;
  useEffect(() => {
    return () => {
      filesRef.current.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, []);

  const validateFiles = (files: File[]): string | null => {
    const totalMB = files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
    if (totalMB > MAX_TOTAL_MB) {
      return `Total size must be under ${MAX_TOTAL_MB}MB`;
    }
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return `Invalid file type: ${file.name}. Use MP4, MOV, WebM, or AVI`;
      }
      if (file.size > MAX_FILE_SIZE) {
        return `File too large: ${file.name} (max 100MB per file)`;
      }
    }
    return null;
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        resolve(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error(`Could not load: ${file.name}`));
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const filesArray = Array.from(newFiles);
    const validationError = validateFiles(filesArray);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const newEntries: FileWithPreview[] = filesArray.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedFiles((prev) => [...prev, ...newEntries]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const moveFile = (index: number, direction: "up" | "down") => {
    setSelectedFiles((prev) => {
      const next = [...prev];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.length) addFiles(files);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) addFiles(files);
    e.target.value = "";
  };

  const handleClick = () => inputRef.current?.click();

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const durations = await Promise.all(
        selectedFiles.map((f) => getVideoDuration(f.file))
      );
      const totalSec = durations.reduce((a, b) => a + b, 0);
      if (totalSec > MAX_TOTAL_DURATION_SEC) {
        setError(
          `Total duration must be under 5 minutes (current: ${Math.ceil(totalSec)}s)`
        );
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read video duration");
      setIsSubmitting(false);
      return;
    }

    await clearVideo();
    onUpload(selectedFiles.map((f) => f.file), selectedStyle);
  };

  const handleClear = async () => {
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    await clearVideo();
    setSelectedFiles([]);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedFiles.length === 0 ? (
        <>
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`upload-zone relative border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all ${
              isDragging
                ? "drag-over border-pink-500"
                : "border-gray-700 hover:border-orange-500"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleInputChange}
              className="hidden"
            />

            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Drop your videos here
              </h3>
              <p className="text-gray-400 mb-4">
                or click to browse • Max 5 min total • {MAX_TOTAL_MB}MB total
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FileVideo className="w-4 h-4" />
                  MP4, MOV, WebM
                </span>
                <span>•</span>
                <span>English Only</span>
                <span>•</span>
                <span>Max 100MB each</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {selectedFiles.length} video{selectedFiles.length > 1 ? "s" : ""} selected
            </p>
            <button
              onClick={handleClick}
              className="text-sm text-orange-400 hover:text-orange-300"
            >
              Add more
            </button>
          </div>

          <div className="space-y-3 max-h-[280px] overflow-y-auto">
            {selectedFiles.map((item, index) => (
              <div
                key={`${item.file.name}-${index}`}
                className="flex items-center gap-3 bg-white/5 rounded-xl p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveFile(index, "up")}
                    disabled={index === 0}
                    className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveFile(index, "down")}
                    disabled={index === selectedFiles.length - 1}
                    className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-20 h-12 rounded-lg overflow-hidden bg-black/50 flex-shrink-0">
                  <video
                    src={item.preview}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate text-sm">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>

                <button
                  onClick={() => removeFile(index)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  aria-label="Remove"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleInputChange}
            className="hidden"
          />

          <StyleSelector
            selectedStyle={selectedStyle}
            onSelectStyle={setSelectedStyle}
          />

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleClear}
              className="flex-1 py-3 rounded-xl font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Clear all
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 btn-primary py-4 rounded-xl font-semibold text-white text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Add Subtitles to All
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
