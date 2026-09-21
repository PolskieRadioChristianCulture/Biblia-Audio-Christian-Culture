// Client-side BYOK (Bring Your Own Key) manager for Gemini and ElevenLabs
// Default storage is sessionStorage (cleared on tab close) for security.
// If the user explicitly checks "remember on this device", localStorage is used.

const GEMINI_KEY_STORAGE = 'ccs_user_gemini_key';
const ELEVENLABS_KEY_STORAGE = 'ccs_user_elevenlabs_key';
const PERSIST_PREF_KEY = 'ccs_persist_keys_pref';

export function shouldPersistKeys(): boolean {
  return localStorage.getItem(PERSIST_PREF_KEY) === 'true';
}

export function setPersistKeys(persist: boolean): void {
  localStorage.setItem(PERSIST_PREF_KEY, persist ? 'true' : 'false');
}

export function getUserGeminiKey(): string {
  const sessionVal = sessionStorage.getItem(GEMINI_KEY_STORAGE);
  if (sessionVal) return sessionVal.trim();
  const localVal = localStorage.getItem(GEMINI_KEY_STORAGE);
  return localVal ? localVal.trim() : '';
}

export function setUserGeminiKey(key: string, persist = shouldPersistKeys()): void {
  const clean = key.trim();
  if (!clean) {
    sessionStorage.removeItem(GEMINI_KEY_STORAGE);
    localStorage.removeItem(GEMINI_KEY_STORAGE);
    return;
  }
  sessionStorage.setItem(GEMINI_KEY_STORAGE, clean);
  if (persist) {
    localStorage.setItem(GEMINI_KEY_STORAGE, clean);
  } else {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
  }
}

export function getUserElevenLabsKey(): string {
  const sessionVal = sessionStorage.getItem(ELEVENLABS_KEY_STORAGE);
  if (sessionVal) return sessionVal.trim();
  const localVal = localStorage.getItem(ELEVENLABS_KEY_STORAGE);
  return localVal ? localVal.trim() : '';
}

export function setUserElevenLabsKey(key: string, persist = shouldPersistKeys()): void {
  const clean = key.trim();
  if (!clean) {
    sessionStorage.removeItem(ELEVENLABS_KEY_STORAGE);
    localStorage.removeItem(ELEVENLABS_KEY_STORAGE);
    return;
  }
  sessionStorage.setItem(ELEVENLABS_KEY_STORAGE, clean);
  if (persist) {
    localStorage.setItem(ELEVENLABS_KEY_STORAGE, clean);
  } else {
    localStorage.removeItem(ELEVENLABS_KEY_STORAGE);
  }
}

export function clearUserKeys(): void {
  sessionStorage.removeItem(GEMINI_KEY_STORAGE);
  localStorage.removeItem(GEMINI_KEY_STORAGE);
  sessionStorage.removeItem(ELEVENLABS_KEY_STORAGE);
  localStorage.removeItem(ELEVENLABS_KEY_STORAGE);
}

export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}
