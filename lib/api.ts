const DEFAULT_API_URL = "http://localhost:7860";

export async function processVideo(
  file: File,
  style: string,
  apiUrl: string = DEFAULT_API_URL
): Promise<Blob> {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("style", style);

  const response = await fetch(`${apiUrl}/api/process`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      typeof errorData.detail === "string"
        ? errorData.detail
        : errorData.detail?.join?.(", ") || "Processing failed"
    );
  }

  return response.blob();
}

export async function processVideos(
  files: File[],
  style: string,
  apiUrl: string = DEFAULT_API_URL
): Promise<Blob> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("videos", file);
  }
  formData.append("style", style);

  const response = await fetch(`${apiUrl}/api/process-reel`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      typeof errorData.detail === "string"
        ? errorData.detail
        : errorData.detail?.join?.(", ") || "Processing failed"
    );
  }

  return response.blob();
}
