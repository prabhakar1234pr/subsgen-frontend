"use client";

import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import { Upload, FileVideo, AlertCircle } from "lucide-react";
import StyleSelector from "./StyleSelector";
import { saveVideo, getVideo, clearVideo } from "@/lib/videoStorage";

interface VideoUploaderProps {
  onUpload: (file: File, style: string) => void;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];

export default function VideoUploader({ onUpload }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState("hormozi");
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore video from IndexedDB on mount
  useEffect(() => {
    const restoreVideo = async () => {
      try {
        const stored = await getVideo();
        if (stored) {
          setSelectedFile(stored.file);
          setSelectedStyle(stored.style);
          const url = URL.createObjectURL(stored.file);
          setPreview(url);
        }
      } catch (err) {
        console.error("Failed to restore video:", err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreVideo();
  }, []);

  // Save to IndexedDB when file or style changes
  useEffect(() => {
    if (selectedFile) {
      saveVideo(selectedFile, selectedStyle);
    }
  }, [selectedFile, selectedStyle]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please upload a video file (MP4, MOV, WebM, or AVI)";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be under 100MB";
    }
    return null;
  };

  const handleFile = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreview(url);
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

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (selectedFile) {
      // Clear storage before processing
      await clearVideo();
      onUpload(selectedFile, selectedStyle);
    }
  };

  const handleClear = async () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    await clearVideo();
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // Show loading state while checking IndexedDB
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!preview ? (
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
              onChange={handleInputChange}
              className="hidden"
            />

            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Drop your video here
              </h3>
              <p className="text-gray-400 mb-4">
                or click to browse from your device
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FileVideo className="w-4 h-4" />
                  MP4, MOV, WebM
                </span>
                <span>•</span>
                <span>English Only</span>
                <span>•</span>
                <span>Max 100MB</span>
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
          {/* Restored indicator */}
          {selectedFile && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
              <p className="text-green-400 text-sm">
                ✓ Your video was restored from your previous session
              </p>
            </div>
          )}

          {/* Video Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-black/50">
            <video
              src={preview}
              controls
              className="w-full max-h-[300px] object-contain"
            />
          </div>

          {/* File Info */}
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <FileVideo className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium text-white truncate max-w-[200px] sm:max-w-none">
                  {selectedFile?.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Change
            </button>
          </div>

          {/* Style Selector */}
          <StyleSelector
            selectedStyle={selectedStyle}
            onSelectStyle={setSelectedStyle}
          />

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full btn-primary py-4 rounded-xl font-semibold text-white text-lg flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Generate Subtitles
          </button>
        </div>
      )}
    </div>
  );
}
