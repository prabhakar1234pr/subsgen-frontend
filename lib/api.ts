const DEFAULT_API_URL = "http://localhost:7860";

function parseErrorDetail(detail: unknown, fallback: string): string {
  if (Array.isArray(detail)) {
    const msgs = detail.map((d: { msg?: string }) => d.msg).filter(Boolean);
    return msgs.length ? msgs.join("; ") : fallback;
  }
  return typeof detail === "string" ? detail : fallback;
}

export async function processVideo(file: File, style: string, apiUrl = DEFAULT_API_URL, signal?: AbortSignal): Promise<Blob> {
  const fd = new FormData();
  fd.append("video", file); fd.append("style", style);
  const r = await fetch(`${apiUrl}/api/process`, { method: "POST", body: fd, signal });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(parseErrorDetail(e.detail, "Failed")); }
  return r.blob();
}

export async function processVideos(files: File[], style: string, apiUrl = DEFAULT_API_URL, signal?: AbortSignal): Promise<Blob> {
  const fd = new FormData();
  files.forEach(f => fd.append("videos", f)); fd.append("style", style);
  const r = await fetch(`${apiUrl}/api/process-reel`, { method: "POST", body: fd, signal });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(parseErrorDetail(e.detail, "Failed")); }
  return r.blob();
}

export interface ReelResult {
  /** URL to video (GCS signed URL or blob URL). Use for playback and download. */
  videoUrl: string;
  caption: { hook: string; body: string; cta: string; hashtags: string[] } | null;
  subtitleStyle: string;
}

export async function processReelPipeline(files: File[], apiUrl = DEFAULT_API_URL, signal?: AbortSignal): Promise<ReelResult> {
  const fd = new FormData();
  files.forEach(f => fd.append("videos", f));
  const r = await fetch(`${apiUrl}/api/reel-pipeline`, { method: "POST", body: fd, signal });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(parseErrorDetail(e.detail, "Pipeline failed")); }

  const contentType = r.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    // GCS: backend returns JSON with download_url
    const data = await r.json();
    return {
      videoUrl: data.download_url,
      caption: data.caption || null,
      subtitleStyle: data.subtitle_style || "hormozi",
    };
  }

  // Local dev: blob + X-Caption header
  const blob = await r.blob();
  let caption = null;
  const captionHeader = r.headers.get("X-Caption");
  if (captionHeader) {
    try { caption = JSON.parse(captionHeader); } catch {}
  }
  const subtitleStyle = r.headers.get("X-Subtitle-Style") || "hormozi";
  return {
    videoUrl: URL.createObjectURL(blob),
    caption,
    subtitleStyle,
  };
}
