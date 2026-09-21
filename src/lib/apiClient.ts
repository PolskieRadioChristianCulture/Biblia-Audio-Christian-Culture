import { getCurrentIdToken } from './firebaseClient';
import { getUserGeminiKey, getUserElevenLabsKey } from './userKeys';

export async function studioFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});

  // Add Firebase ID Token if logged in
  try {
    const idToken = await getCurrentIdToken();
    if (idToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${idToken}`);
    }
  } catch (err) {
    console.warn('Could not attach Firebase auth token:', err);
  }

  // Add BYOK Gemini API key if present
  const geminiKey = getUserGeminiKey();
  if (geminiKey && !headers.has('X-User-Gemini-Key')) {
    headers.set('X-User-Gemini-Key', geminiKey);
  }

  // Add BYOK ElevenLabs API key if present
  const elevenLabsKey = getUserElevenLabsKey();
  if (elevenLabsKey && !headers.has('X-User-ElevenLabs-Key')) {
    headers.set('X-User-ElevenLabs-Key', elevenLabsKey);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
