// IndexedDB & Safe LocalStorage Manager for CC STUDIO DAW

const DB_NAME = 'BibliaAudioStudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
export const STORAGE_KEY = 'biblia_audio_studio_projects';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProjectsToIDB(projects: any[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const p of projects) {
      store.put(p);
    }
  } catch (err) {
    console.debug('[Storage] IndexedDB save note:', err);
  }
}

export async function loadProjectsFromIDB(): Promise<any[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result;
        if (Array.isArray(results) && results.length > 0) {
          resolve(results);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export function cleanProjectForLocalStorage(project: any): any {
  if (!project) return project;
  return {
    ...project,
    generatedClips: (project.generatedClips || []).map((clip: any) => ({
      ...clip,
      audioBase64: '',
      audioUrl: undefined,
    })),
    masterAudioWavUrl: undefined,
    masterAudioMp3Url: undefined,
    renderedVideoMp4Url: undefined,
    script: project.script
      ? {
          ...project.script,
          lines: (project.script.lines || []).map((line: any) => ({
            ...line,
            cachedAudioBase64: undefined,
            customAudioFile: line.customAudioFile
              ? {
                  fileName: line.customAudioFile.fileName,
                  fileSizeBytes: line.customAudioFile.fileSizeBytes,
                  durationSec: line.customAudioFile.durationSec,
                  uploadedAt: line.customAudioFile.uploadedAt,
                  audioUrl: '',
                  base64: undefined,
                }
              : undefined,
          })),
        }
      : project.script,
    mixerSettings: project.mixerSettings
      ? {
          ...project.mixerSettings,
          customMusicTrack: project.mixerSettings.customMusicTrack
            ? {
                fileName: project.mixerSettings.customMusicTrack.fileName,
                fileSizeBytes: project.mixerSettings.customMusicTrack.fileSizeBytes,
                durationSec: project.mixerSettings.customMusicTrack.durationSec,
                uploadedAt: project.mixerSettings.customMusicTrack.uploadedAt,
                audioUrl: '',
                base64: undefined,
              }
            : undefined,
        }
      : project.mixerSettings,
  };
}

export function safeSaveToLocalStorage(projects: any[]): void {
  try {
    // Only save last 2 projects to stay well below 5MB origin quota
    const trimmed = projects.slice(-2).map(cleanProjectForLocalStorage);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err: any) {
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      try {
        const single = projects.slice(-1).map(cleanProjectForLocalStorage);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(single));
      } catch {
        // Quota completely exhausted: keep memory & IndexedDB state silently
      }
    }
  }
}
