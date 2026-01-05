/**
 * IndexedDB storage for persisting video files across page refreshes.
 * Data is cleared when the browser tab is closed.
 */

const DB_NAME = "subsgen_videos";
const STORE_NAME = "pending_video";
const DB_VERSION = 1;

interface StoredVideo {
  id: string;
  file: File;
  style: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function saveVideo(file: File, style: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const videoData: StoredVideo = {
      id: "current_video",
      file: file,
      style: style,
      timestamp: Date.now(),
    };

    store.put(videoData);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error("Failed to save video to IndexedDB:", error);
  }
}

export async function getVideo(): Promise<{ file: File; style: string } | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get("current_video");

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        const data = request.result as StoredVideo | undefined;
        if (data && data.file) {
          // Check if video is less than 30 minutes old
          const thirtyMinutes = 30 * 60 * 1000;
          if (Date.now() - data.timestamp < thirtyMinutes) {
            resolve({ file: data.file, style: data.style });
          } else {
            // Too old, clear it
            clearVideo();
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("Failed to get video from IndexedDB:", error);
    return null;
  }
}

export async function clearVideo(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.delete("current_video");

    return new Promise((resolve) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch (error) {
    console.error("Failed to clear video from IndexedDB:", error);
  }
}

// Clear storage when tab is closed (not on refresh)
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    // We use sessionStorage flag to detect refresh vs close
    sessionStorage.setItem("subsgen_session", "active");
  });

  // Check if this is a new session (tab was closed and reopened)
  window.addEventListener("load", () => {
    const isNewSession = !sessionStorage.getItem("subsgen_session");
    if (isNewSession) {
      // New tab/session - clear old videos
      clearVideo();
    }
    sessionStorage.setItem("subsgen_session", "active");
  });
}

