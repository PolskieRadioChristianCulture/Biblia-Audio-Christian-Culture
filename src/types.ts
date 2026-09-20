export type RoleGender = 'male' | 'female' | 'divine' | 'narrator';

export type RoleArchetype =
  | 'narrator'
  | 'jesus'
  | 'god'
  | 'prophet'
  | 'male'
  | 'female'
  | 'crowd'
  | 'child';

export type GeminiVoiceName =
  | 'Puck'
  | 'Charon'
  | 'Kore'
  | 'Fenrir'
  | 'Aoede'
  | 'Zephyr';

export interface DramaCharacter {
  id: string;
  name: string;
  gender: RoleGender;
  roleType: RoleArchetype;
  voiceProfile: string;
  recommendedPitch: number; // 0.7 - 1.3
  recommendedRate: number;  // 0.8 - 1.2
  geminiVoice: GeminiVoiceName;
  colorClass?: string;
  pronunciationNotes?: string;
}

export interface DramaLine {
  id: string;
  sceneNumber: number;
  verseRef?: string;
  characterId: string;
  characterName: string;
  text: string;
  originalVerbatimText?: string;
  emotionCue?: string;
  sfxCue?: string;
  pauseAfterMs?: number;
  pauseBeforeMs?: number;
  tempoMultiplier?: number;
  volumeMultiplier?: number;
  disableMusic?: boolean;
  disableSfx?: boolean;
  requiresManualReview?: boolean;
  cachedAudioBase64?: string;
  cachedAudioDurationSec?: number;
}

export interface PodcastMetadata {
  episodeTitle: string;
  seriesName: string;
  episodeNumber: number;
  author: string;
  description: string;
  summary: string;
  bookAndChapter: string;
  translationUsed: string;
  sourceAttribution: string;
  characterList: string[];
  keywords: string[];
  tags?: string[];
  youtubeDescription: string;
  podcastRssDescription: string;
  socialPostDraft: string;
  suggestedBroadcastSlot?: string;
}

export type MusicAtmosphere =
  | 'sacred_strings'
  | 'temple_harp'
  | 'deep_ambient'
  | 'solemn_choir'
  | 'desert_wind'
  | 'peaceful_dawn'
  | 'none';

export type ProductionMode =
  | 'pure_bible'
  | 'clean_bible'       // 1. Czysta Biblia (głosy bez muzyki i efektów)
  | 'radio_broadcast'   // 2. Audycja Radiowa (intro/outro, lektor, delikatne tło)
  | 'radio_drama'
  | 'cinematic_drama';  // 3. Słuchowisko Filmowe (przestrzeń, efekty, dynamiczny montaż)

export type SpeechEngineMode = 'ai_neural' | 'browser_enhanced';

export type DirectorStyle = 'reverent' | 'balanced' | 'dramatic';

export interface DirectorReport {
  lastDirectedAt: number;
  directorStyle: DirectorStyle;
  totalLinesDirected: number;
  femaleRolesGuardedCount: number;
  femaleCharacterNames: string[];
  averageTempo: number;
  tempoRange: { min: number; max: number };
  dominantMood: string;
  pacingNote: string;
  modificationsCount: number;
  guardedFemaleNotes?: string[];
}

export interface AudioMixerSettings {
  mode: ProductionMode;
  directorStyle?: DirectorStyle;
  includeStationIntro?: boolean;
  stationIntroText?: string;
  introVoice?: GeminiVoiceName;
  includeStationOutro?: boolean;
  stationOutroText?: string;
  outroVoice?: GeminiVoiceName;
  includeStationJingle?: boolean;
  backgroundMusic?: MusicAtmosphere;
  musicVolume: number;    // 0 - 100
  voiceVolume: number;    // 0 - 100
  sfxVolume: number;      // 0 - 100
  reverbLevel?: number;   // 0 - 100
  reverbAmount?: number;  // 0 - 1
  stereoWidth: number;    // 0 - 100
  speechRate?: number;    // 0.8 - 1.2
  speechSpeed?: number;   // 0.8 - 1.2
  speechEngine?: SpeechEngineMode;
  warmBroadcastFilter?: boolean;
  radioTubeWarmth?: boolean;
  wordClarityPriority: boolean; // "Czytelność Słowa" (ducking muzyki/sfx pod mową)
  enableIntroOutro?: boolean;
}

export interface RadioDramaScript {
  title: string;
  subtitle?: string;
  bibleReference: string;
  estimatedDurationMinutes: number;
  stationIntro: string;
  stationOutro: string;
  atmosphereMood: string;
  characters: DramaCharacter[];
  lines: DramaLine[];
  podcastMetadata: PodcastMetadata;
}

export type BibleSourceType =
  | 'user_text'
  | 'public_domain'
  | 'licensed_cc'
  | 'other_authorized';

export type ProjectProductionStatus =
  | 'draft'               // Wersja robocza
  | 'analyzed'            // Przeanalizowano
  | 'approved'            // Scenariusz zatwierdzony
  | 'generating_voices'   // Generowanie głosów
  | 'assembly'            // Montaż
  | 'ready'               // Gotowe do emisji
  | 'error'               // Błąd
  | 'published';          // Opublikowane

export interface GeneratedAudioClip {
  lineId: string;
  characterId: string;
  audioBase64: string;
  audioUrl?: string;
  durationSec: number;
}

export interface ProductionProject {
  id: string;
  title: string;
  bookName: string;
  chapterNumber: number | string;
  translation: string;
  language: string;
  sourceType: BibleSourceType;
  rightsConfirmed: boolean;
  rawSourceText: string;
  status: ProjectProductionStatus;
  createdAt: string;
  updatedAt: string;
  script: RadioDramaScript;
  mixerSettings: AudioMixerSettings;
  generatedClips: GeneratedAudioClip[];
  masterAudioWavUrl?: string;
  masterAudioMp3Url?: string;
}

export interface BibleBookQuickRef {
  name: string;
  abbr: string;
  testament: 'ST' | 'NT';
  defaultChapters: number;
}

// ---------------------------------------------------------------------------
// BIBLIA AUDIO VIDEO STUDIO TYPES (YouTube 16:9, 4K & Shorts)
// ---------------------------------------------------------------------------

export type VideoMode =
  | 'radio'        // 1. Tryb Radiowy: 1 grafika tła, ruch kamery, światło, wizualizacja, logo, napisy
  | 'cinematic'    // 2. Tryb Filmowe Słuchowisko: osobne obrazy dla scen, płynne przejścia, spójny styl
  | 'minimalist';  // 3. Tryb Minimalistyczny: eleganckie ciemne tło, złota typografia, subtelny visualizer

export type VideoResolution =
  | '1080p'        // 1920x1080 (YouTube Standard)
  | '4k'           // 3840x2160 (YouTube 4K)
  | 'shorts';      // 1080x1920 (YouTube Shorts 9:16)

export type VideoVisualizerType =
  | 'waveform'         // Fala dźwiękowa (oscyloskop)
  | 'frequency_bars'   // Pasmo częstotliwości
  | 'pulsing_glow'     // Pulsujące światło
  | 'voice_line'       // Linia reagująca na głos
  | 'none';            // Brak wizualizacji

export type VideoArtStyle =
  | 'cinematic_realism'       // Filmowy realizm
  | 'painterly_illustration'  // Malarska ilustracja (klasyczne malarstwo sakralne)
  | 'documentary'             // Styl dokumentalny
  | 'subtle_animation'        // Subtelna animacja
  | 'minimalist_radio';       // Minimalistyczne tło radiowe

export type VideoMotionEffect =
  | 'slow_zoom_in'
  | 'slow_zoom_out'
  | 'pan_right'
  | 'pan_left'
  | 'still';

export interface VideoScene {
  id: string;
  sceneNumber: number;
  title: string;
  startSec: number;
  durationSec: number;
  imageUrl: string;
  imagePrompt: string;
  imageSource: string; // np. 'Domena publiczna: Rembrandt' | 'Przesłany plik' | 'AI Gemini'
  author: string;
  license: string;
  rightsConfirmed: boolean;
  motionType: VideoMotionEffect;
}

export interface CharacterProfile {
  id: string;
  name: string;
  visualDescription: string;
  approxAge: string;
  attire: string;
  distinguishingFeatures: string;
  historicalContext: string;
  assignedVoice: GeminiVoiceName;
  referenceImageUrl?: string;
  forbiddenChanges: string; // Zasady: unikać współczesnych przedmiotów, nie przedstawiać Boga Ojca jako człowieka itd.
}

export interface SubtitleCue {
  id: string;
  lineId: string;
  verseRef: string;
  characterName: string;
  text: string;
  startSec: number;
  endSec: number;
}

export interface VideoSettings {
  mode: VideoMode;
  resolution: VideoResolution;
  visualizer: VideoVisualizerType;
  artStyle: VideoArtStyle;
  motionEffect: VideoMotionEffect;
  fps: 25 | 30;
  showSubtitles: boolean;
  showVerseNumbers: boolean;
  subtitlesPosition: 'bottom' | 'middle';
  subtitlesFontSize: 'normal' | 'large';
  showLogo: boolean;
  logoPosition: 'top_right' | 'top_left' | 'bottom_right';
  includeIntro: boolean;
  introDurationSec: number;
  introTitle: string;
  introSlogan: string;
  includeOutro: boolean;
  outroDurationSec: number;
  outroTitle: string;
  outroText: string;
  outroStationUrl: string;
  scenes: VideoScene[];
  customBackgroundUrl?: string;
  selectedThumbnailTemplate: number; // 0, 1, 2
  thumbnailTitle?: string;
}

export interface YouTubePublishPlan {
  channelTitle: string;
  channelId: string;
  isAuthorized: boolean;
  title: string;
  description: string;
  tags: string[];
  category: string;
  privacyStatus: 'private' | 'unlisted' | 'public';
  playlistId: string;
  madeForKids: boolean;
  embeddable: boolean;
  license: 'youtube' | 'creativeCommon';
}

export interface ProductionProject {
  id: string;
  title: string;
  bookName: string;
  chapterNumber: number | string;
  translation: string;
  language: string;
  sourceType: BibleSourceType;
  rightsConfirmed: boolean;
  rawSourceText: string;
  status: ProjectProductionStatus;
  createdAt: string;
  updatedAt: string;
  script: RadioDramaScript;
  mixerSettings: AudioMixerSettings;
  generatedClips: GeneratedAudioClip[];
  masterAudioWavUrl?: string;
  masterAudioMp3Url?: string;
  masterAudioDurationSec?: number;
  directorReport?: DirectorReport;
  // Video production attributes
  videoSettings: VideoSettings;
  characterProfiles: CharacterProfile[];
  renderedVideoMp4Url?: string;
  renderedVideoShortsUrl?: string;
  renderedVideoStatus?: 'idle' | 'rendering' | 'ready' | 'error';
  renderedVideoError?: string;
  renderedVideoProgress?: { stage: string; percent: number };
  renderedVideoSpecs?: {
    resolution: string;
    durationSec: number;
    fileSizeBytes: number;
    fps: number;
  };
  youtubePublishPlan?: YouTubePublishPlan;
}
