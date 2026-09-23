import { ProductionProject, DramaLine, GeneratedAudioClip } from '../types';

export type StemMode = 'master' | 'voice' | 'music' | 'jingle';

export interface StudioPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentLineIndex: number;
  currentLineRef: string;
  currentSpeaker: string;
  currentText: string;
  currentTimeSec: number;
  totalDurationSec: number;
  masterVolume: number; // 0..1
  voiceVolume: number;  // 0..1
  musicVolume: number;  // 0..1
  sfxVolume: number;    // 0..1
  speechRate: number;   // 0.7..1.3
  mutedTracks: {
    voice: boolean;
    music: boolean;
    fx: boolean;
  };
  stemMode: StemMode;
  meterL: number; // 0..10
  meterR: number; // 0..10
}

class StudioPlaybackEngine {
  private project: ProductionProject | null = null;
  private voiceAudio: HTMLAudioElement | null = null;
  private musicAudio: HTMLAudioElement | null = null;
  private sfxAudio: HTMLAudioElement | null = null;

  // Web Audio Context for procedural background music & metering
  private audioCtx: AudioContext | null = null;
  private synthNodes: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;

  // Real-time AnalyserNode for FFT visualizer
  private analyserNode: AnalyserNode | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private analyserData: Uint8Array = new Uint8Array(64);

  private isPlaying = false;
  private isPaused = false;
  private currentLineIndex = 0;
  private currentTimeSec = 0;
  private masterVolume = 0.9;
  private voiceVolume = 1.0;
  private musicVolume = 0.35;
  private sfxVolume = 0.4;
  private speechRate = 1.0;
  private mutedTracks = { voice: false, music: false, fx: false };
  private stemMode: StemMode = 'master';

  private meterL = 0;
  private meterR = 0;
  private meterAnimFrame: number | null = null;

  private pauseTimeout: any = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.startMeterLoop();
  }


  public setProject(project: ProductionProject) {
    const prevId = this.project?.id;
    this.project = project;

    // Apply mixer settings from project if present
    if (project.mixerSettings) {
      this.musicVolume = (project.mixerSettings.musicVolume ?? 35) / 100;
      this.voiceVolume = (project.mixerSettings.voiceVolume ?? 100) / 100;
      this.sfxVolume = (project.mixerSettings.sfxVolume ?? 40) / 100;
      this.speechRate = project.mixerSettings.speechRate ?? 1.0;
    }

    if (prevId !== project.id) {
      this.stop();
      this.currentLineIndex = 0;
      this.currentTimeSec = 0;
    }

    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.warn('Playback listener error:', e);
      }
    });
  }

  public getState(): StudioPlaybackState {
    const lines = this.project?.script?.lines || [];
    const line = lines[this.currentLineIndex];
    const totalDurationSec = this.calculateTotalDuration();

    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentLineIndex: this.currentLineIndex,
      currentLineRef: line?.verseRef || `Kwestia ${this.currentLineIndex + 1}`,
      currentSpeaker: line?.characterName || 'Narrator',
      currentText: line?.text || '',
      currentTimeSec: this.currentTimeSec,
      totalDurationSec,
      masterVolume: this.masterVolume,
      voiceVolume: this.voiceVolume,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      speechRate: this.speechRate,
      mutedTracks: { ...this.mutedTracks },
      stemMode: this.stemMode,
      meterL: this.meterL,
      meterR: this.meterR,
    };
  }

  public calculateTotalDuration(): number {
    if (!this.project?.script?.lines) return 60;
    const lines = this.project.script.lines;
    const clips = this.project.generatedClips || [];

    let total = 0;
    for (const line of lines) {
      if (line.customAudioFile?.durationSec) {
        total += line.customAudioFile.durationSec;
      } else {
        const clip = clips.find((c) => c.lineId === line.id);
        if (clip?.durationSec) {
          total += clip.durationSec;
        } else {
          const words = (line.text || '').split(/\s+/).filter(Boolean).length;
          total += Math.max(2.0, words / 3.0);
        }
      }
      total += (line.pauseAfterMs || 700) / 1000;
    }
    return Math.max(10, Math.round(total));
  }

  // --- Controls ---

  public play() {
    if (!this.project) return;
    if (this.isPaused) {
      this.resume();
      return;
    }

    this.isPlaying = true;
    this.isPaused = false;

    // Start background music bed if in master or music mode and not muted
    if (
      (this.stemMode === 'master' || this.stemMode === 'music') &&
      !this.mutedTracks.music
    ) {
      this.startMusicBed();
    }

    this.playLine(this.currentLineIndex);
    this.notify();
  }

  public pause() {
    this.isPaused = true;
    if (this.voiceAudio) {
      this.voiceAudio.pause();
    }
    if (this.musicAudio) {
      this.musicAudio.pause();
    }
    if (this.synthNodes) {
      this.stopSynthesizer();
    }
    if (this.pauseTimeout) {
      clearTimeout(this.pauseTimeout);
      this.pauseTimeout = null;
    }
    this.notify();
  }

  public resume() {
    if (!this.isPlaying) {
      this.play();
      return;
    }
    this.isPaused = false;
    if (this.voiceAudio && this.voiceAudio.src) {
      this.voiceAudio.play().catch(() => {});
    }
    if (this.musicAudio && !this.mutedTracks.music) {
      this.musicAudio.play().catch(() => {});
    }
    this.notify();
  }

  public stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentLineIndex = 0;
    this.currentTimeSec = 0;

    if (this.voiceAudio) {
      this.voiceAudio.pause();
      this.voiceAudio.currentTime = 0;
      this.voiceAudio = null;
    }
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
      this.musicAudio = null;
    }
    if (this.synthNodes) {
      this.stopSynthesizer();
    }
    if (this.pauseTimeout) {
      clearTimeout(this.pauseTimeout);
      this.pauseTimeout = null;
    }
    this.notify();
  }

  public seekToLine(index: number) {
    const lines = this.project?.script?.lines || [];
    if (index < 0 || index >= lines.length) return;

    const wasPlaying = this.isPlaying && !this.isPaused;
    if (this.voiceAudio) {
      this.voiceAudio.pause();
    }
    if (this.pauseTimeout) {
      clearTimeout(this.pauseTimeout);
      this.pauseTimeout = null;
    }

    this.currentLineIndex = index;
    // Estimate current time up to this line
    this.currentTimeSec = this.calculateTimeUpToLine(index);

    if (wasPlaying) {
      this.playLine(index);
    }
    this.notify();
  }

  public next() {
    const lines = this.project?.script?.lines || [];
    if (this.currentLineIndex + 1 < lines.length) {
      this.seekToLine(this.currentLineIndex + 1);
    }
  }

  public prev() {
    if (this.currentLineIndex > 0) {
      this.seekToLine(this.currentLineIndex - 1);
    }
  }

  public setStemMode(mode: StemMode) {
    this.stemMode = mode;
    // Adjust mute states or audio streams according to stem mode
    if (mode === 'voice') {
      if (this.musicAudio) this.musicAudio.pause();
      this.stopSynthesizer();
    } else if (mode === 'music') {
      if (this.voiceAudio) this.voiceAudio.pause();
      this.startMusicBed();
    } else if (mode === 'master') {
      if (this.isPlaying && !this.isPaused) {
        this.startMusicBed();
      }
    }
    this.notify();
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.min(1, Math.max(0, vol));
    this.updateAudioVolumes();
    this.notify();
  }

  public setTrackVolume(track: 'voice' | 'music' | 'sfx', vol: number) {
    const clamped = Math.min(1, Math.max(0, vol));
    if (track === 'voice') this.voiceVolume = clamped;
    if (track === 'music') this.musicVolume = clamped;
    if (track === 'sfx') this.sfxVolume = clamped;
    this.updateAudioVolumes();
    this.notify();
  }

  public setSpeechRate(rate: number) {
    this.speechRate = Math.min(1.4, Math.max(0.7, rate));
    if (this.voiceAudio) {
      this.voiceAudio.playbackRate = this.speechRate;
    }
    this.notify();
  }

  public toggleMute(track: 'voice' | 'music' | 'fx') {
    this.mutedTracks[track] = !this.mutedTracks[track];
    this.updateAudioVolumes();
    this.notify();
  }

  public getAnalyserData(): Uint8Array | null {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(this.analyserData as any);
      return this.analyserData;
    }
    return null;
  }

  // --- Line Sequencing ---

  private playLine(index: number) {
    const lines = this.project?.script?.lines || [];
    if (index < 0 || index >= lines.length) {
      // Completed all lines
      this.stop();
      return;
    }

    this.currentLineIndex = index;
    const line = lines[index];
    const clip = this.project?.generatedClips?.find((c) => c.lineId === line.id);
    const audioSource = line.customAudioFile?.audioUrl || clip?.audioUrl;

    if (this.stemMode === 'music') {
      // In music stem mode, we advance line timer without playing voice
      const durationSec = line.customAudioFile?.durationSec || clip?.durationSec || 3;
      this.pauseTimeout = setTimeout(() => {
        if (this.isPlaying && !this.isPaused) {
          this.playLine(index + 1);
        }
      }, durationSec * 1000 + (line.pauseAfterMs || 700));
      this.notify();
      return;
    }

    if (audioSource && !this.mutedTracks.voice) {
      if (!this.voiceAudio) {
        this.voiceAudio = new Audio();
        // Wire once through Web Audio for real FFT metering
        try {
          if (!this.audioCtx) {
            const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
            this.audioCtx = new AudioCtxClass();
          }
          if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
          }
          this.mediaSource = this.audioCtx.createMediaElementSource(this.voiceAudio);
          this.analyserNode = this.audioCtx.createAnalyser();
          this.analyserNode.fftSize = 128;
          this.analyserData = new Uint8Array(this.analyserNode.frequencyBinCount);
          this.mediaSource.connect(this.analyserNode);
          this.analyserNode.connect(this.audioCtx.destination);
        } catch (e) {
          console.warn('Web Audio metering unavailable:', e);
        }
      }
      this.voiceAudio.src = audioSource;
      const customRate = line.tempoMultiplier || 1.0;
      this.voiceAudio.playbackRate = this.speechRate * customRate;
      this.voiceAudio.volume = this.masterVolume * this.voiceVolume;

      // Duck background music during active voice
      this.duckMusic(true);

      this.voiceAudio.onended = () => {
        this.duckMusic(false);
        const pause = line.pauseAfterMs || 700;
        this.pauseTimeout = setTimeout(() => {
          if (this.isPlaying && !this.isPaused) {
            this.playLine(index + 1);
          }
        }, pause);
      };

      this.voiceAudio.onerror = (e) => {
        console.warn('Line audio error, advancing:', e);
        this.duckMusic(false);
        this.pauseTimeout = setTimeout(() => {
          if (this.isPlaying && !this.isPaused) {
            this.playLine(index + 1);
          }
        }, 1200);
      };

      this.voiceAudio.play().catch((err) => {
        console.warn('Playback play() was prevented:', err);
      });
    } else {
      // No audio file yet: synthesize clean preview or simulate timing
      const words = (line.text || '').split(/\s+/).filter(Boolean).length;
      const durationMs = Math.max(1800, (words / 3.0) * 1000);

      // Try browser TTS if in voice/master mode
      if (!this.mutedTracks.voice && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          const utter = new SpeechSynthesisUtterance(line.text);
          utter.lang = 'pl-PL';
          utter.rate = this.speechRate;
          utter.volume = this.masterVolume * this.voiceVolume;
          window.speechSynthesis.speak(utter);
        } catch (e) {}
      }

      this.pauseTimeout = setTimeout(() => {
        if (this.isPlaying && !this.isPaused) {
          this.playLine(index + 1);
        }
      }, durationMs + (line.pauseAfterMs || 700));
    }

    this.notify();
  }

  // --- Background Music Bed ---

  private startMusicBed() {
    const customMusic = this.project?.mixerSettings?.customMusicTrack;
    if (customMusic?.audioUrl) {
      // Use uploaded custom music track
      if (!this.musicAudio) {
        this.musicAudio = new Audio(customMusic.audioUrl);
        this.musicAudio.loop = true;
      } else {
        this.musicAudio.src = customMusic.audioUrl;
      }
      this.musicAudio.volume = this.masterVolume * this.musicVolume;
      this.musicAudio.play().catch((e) => {
        console.warn('Custom music play blocked:', e);
      });
    } else {
      // Start sacred strings procedural synthesizer
      this.startSynthesizer();
    }
  }

  private duckMusic(isSpeechActive: boolean) {
    const targetVol = isSpeechActive
      ? this.masterVolume * this.musicVolume * 0.25 // -12dB auto duck
      : this.masterVolume * this.musicVolume;

    if (this.musicAudio) {
      this.musicAudio.volume = Math.max(0.02, targetVol);
    }
    if (this.synthNodes?.gain) {
      const ctx = this.synthNodes.gain.context;
      this.synthNodes.gain.gain.setTargetAtTime(targetVol * 0.15, ctx.currentTime, 0.2);
    }
  }

  private updateAudioVolumes() {
    if (this.voiceAudio) {
      this.voiceAudio.volume = this.mutedTracks.voice
        ? 0
        : this.masterVolume * this.voiceVolume;
    }
    if (this.musicAudio) {
      this.musicAudio.volume = this.mutedTracks.music
        ? 0
        : this.masterVolume * this.musicVolume;
    }
    if (this.synthNodes?.gain) {
      const vol = this.mutedTracks.music ? 0 : this.masterVolume * this.musicVolume * 0.15;
      const ctx = this.synthNodes.gain.context;
      this.synthNodes.gain.gain.setTargetAtTime(vol, ctx.currentTime, 0.1);
    }
  }

  private startSynthesizer() {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.stopSynthesizer();

      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Reverent sacred fifth interval (D2 = 73.42Hz, A2 = 110Hz)
      osc1.type = 'sine';
      osc1.frequency.value = 73.42;

      osc2.type = 'triangle';
      osc2.frequency.value = 110.0;

      const baseVol = this.mutedTracks.music ? 0 : this.masterVolume * this.musicVolume * 0.12;
      gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, baseVol), this.audioCtx.currentTime + 1.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc1.start();
      osc2.start();

      this.synthNodes = { osc1, osc2, gain };
    } catch (e) {
      console.warn('Could not start sacred synth:', e);
    }
  }

  private stopSynthesizer() {
    if (this.synthNodes) {
      try {
        this.synthNodes.osc1.stop();
        this.synthNodes.osc2.stop();
        this.synthNodes.gain.disconnect();
      } catch (e) {}
      this.synthNodes = null;
    }
  }

  // --- Real-time Metering Loop (FL Studio L/R Bar Meters) ---

  private startMeterLoop() {
    const update = () => {
      if (this.analyserNode && this.isPlaying && !this.isPaused) {
        this.analyserNode.getByteFrequencyData(this.analyserData as any);
        const half = Math.floor(this.analyserData.length / 2);
        let sumL = 0, sumR = 0;
        for (let i = 0; i < half; i++) sumL += this.analyserData[i];
        for (let i = half; i < this.analyserData.length; i++) sumR += this.analyserData[i];
        // Map 0..255 average to 0..10 scale
        this.meterL = Math.min(10, Math.round((sumL / half) / 25.5));
        this.meterR = Math.min(10, Math.round((sumR / (this.analyserData.length - half)) / 25.5));
      } else if (!this.isPlaying || this.isPaused) {
        // Decay to zero when idle/paused
        this.meterL = Math.max(0, this.meterL - 1);
        this.meterR = Math.max(0, this.meterR - 1);
      }
      this.meterAnimFrame = requestAnimationFrame(update);
    };
    this.meterAnimFrame = requestAnimationFrame(update);
  }

  private calculateTimeUpToLine(targetIndex: number): number {
    if (!this.project?.script?.lines) return 0;
    const lines = this.project.script.lines;
    const clips = this.project.generatedClips || [];

    let total = 0;
    for (let i = 0; i < Math.min(targetIndex, lines.length); i++) {
      const line = lines[i];
      if (line.customAudioFile?.durationSec) {
        total += line.customAudioFile.durationSec;
      } else {
        const clip = clips.find((c) => c.lineId === line.id);
        total += clip?.durationSec || 2.5;
      }
      total += (line.pauseAfterMs || 700) / 1000;
    }
    return Math.round(total);
  }
}

// Global Singleton Instance
export const studioPlaybackEngine = new StudioPlaybackEngine();
