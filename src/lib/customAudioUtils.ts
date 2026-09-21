import { CustomAudioTrack } from '../types';

/**
 * Loads a user-uploaded audio file (MP3, WAV, AAC, OGG, M4A)
 * into a browser object URL and probes its exact duration.
 */
export async function readAudioFile(file: File): Promise<CustomAudioTrack> {
  const audioUrl = URL.createObjectURL(file);

  const base64Promise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = (reader.result as string) || '';
      const base64 = res.includes('base64,') ? res.split('base64,')[1] : res;
      resolve(base64);
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });

  const durationSecPromise = new Promise<number>((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = audioUrl;

    const onLoaded = () => {
      cleanup();
      resolve(audio.duration && !isNaN(audio.duration) ? audio.duration : 0);
    };

    const onError = () => {
      cleanup();
      resolve(0);
    };

    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);

    // Fallback if metadata event doesn't fire promptly
    setTimeout(() => {
      if (audio.duration && !isNaN(audio.duration)) {
        cleanup();
        resolve(audio.duration);
      }
    }, 1200);
  });

  const [durationSec, base64] = await Promise.all([durationSecPromise, base64Promise]);

  return {
    fileName: file.name,
    fileSizeBytes: file.size,
    audioUrl,
    base64,
    durationSec: Math.round(durationSec * 10) / 10,
    uploadedAt: Date.now(),
    mimeType: file.type || 'audio/mpeg',
  };
}

export function formatDuration(sec?: number): string {
  if (!sec || isNaN(sec) || sec <= 0) return '0:00';
  const mins = Math.floor(sec / 60);
  const remainder = Math.floor(sec % 60);
  return `${mins}:${remainder.toString().padStart(2, '0')}`;
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
