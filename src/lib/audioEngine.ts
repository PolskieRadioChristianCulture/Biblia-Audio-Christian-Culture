import { AudioMixerSettings, DramaCharacter, DramaLine, MusicAtmosphere, RadioDramaScript } from '../types';

export class DramaAudioEngine {
  private ctx: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private activeOscillators: (OscillatorNode | AudioNode)[] = [];
  private isMusicPlaying = false;
  private musicInterval: any = null;
  private activeVoiceSource: AudioBufferSourceNode | null = null;

  private initContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.masterGainNode) {
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.connect(this.ctx.destination);
    }
    if (!this.musicGainNode) {
      this.musicGainNode = this.ctx.createGain();
      this.musicGainNode.connect(this.masterGainNode);
    }
    return this.ctx;
  }

  // Play Christian Culture Station Identification Jingle or custom uploaded jingle
  public playStationJingle(customJingleUrl?: string): Promise<void> {
    if (customJingleUrl) {
      return this.playCustomAudio(customJingleUrl, 0.9);
    }
    const ctx = this.initContext();
    return new Promise((resolve) => {
      const now = ctx.currentTime;
      // Chime progression: F4 -> A4 -> C5 -> F5 with bell harmonics
      const notes = [349.23, 440.0, 523.25, 698.46];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.35);

        // Bell envelope
        gain.gain.setValueAtTime(0.0001, now + index * 0.35);
        gain.gain.exponentialRampToValueAtTime(0.3, now + index * 0.35 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.35 + 1.2);

        osc.connect(gain);
        gain.connect(this.masterGainNode || ctx.destination);

        osc.start(now + index * 0.35);
        osc.stop(now + index * 0.35 + 1.3);
      });

      setTimeout(() => {
        resolve();
      }, (notes.length * 0.35 + 1.2) * 1000);
    });
  }

  // Play custom uploaded audio file (blob / object URL or MP3/WAV)
  public playCustomAudio(audioUrl: string, volume: number = 1.0): Promise<void> {
    this.stopVoice();
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      audio.volume = Math.min(1.0, Math.max(0, volume));
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch((err) => {
        console.warn('Custom audio playback error:', err);
        resolve();
      });
    });
  }

  // Play Biblical SFX cue (e.g., wind, sea waves, temple chime, quiet strings)
  public playSfx(cue: string) {
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const lower = (cue || '').toLowerCase();

    if (lower.includes('wiatr') || lower.includes('pustyn') || lower.includes('wicher') || lower.includes('fale')) {
      // Procedural wind / wave noise
      const bufferSize = ctx.sampleRate * 2.5;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(lower.includes('wicher') ? 500 : 320, now);
      filter.Q.setValueAtTime(2.0, now);
      filter.frequency.exponentialRampToValueAtTime(180, now + 2.5);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGainNode || ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 2.5);
    } else if (lower.includes('harf') || lower.includes('dzwonk') || lower.includes('anio')) {
      // High celestial harp chime
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.12);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(this.masterGainNode || ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 1.2);
      });
    } else {
      // Warm subtle room acoustic impulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.8);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGainNode || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    }
  }

  // Start background sacred atmospheric music
  public startAtmosphere(type: MusicAtmosphere, volume: number = 0.3) {
    this.stopAtmosphere();
    if (type === 'none') return;

    const ctx = this.initContext();
    this.isMusicPlaying = true;
    if (this.musicGainNode) {
      this.musicGainNode.gain.setValueAtTime(volume * 0.25, ctx.currentTime);
    }

    const chords = [
      [146.83, 220.0, 261.63, 349.23], // Dm9
      [116.54, 174.61, 233.08, 293.66], // Bbmaj7
      [130.81, 196.0, 261.63, 329.63], // C add9
      [110.0, 164.81, 220.0, 261.63],  // Am7
    ];

    let chordIdx = 0;

    const playChord = () => {
      if (!this.isMusicPlaying || !this.ctx || this.ctx.state === 'closed') return;
      const now = this.ctx.currentTime;
      const currentChord = chords[chordIdx % chords.length];
      chordIdx++;

      currentChord.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        if (type === 'sacred_strings') {
          osc.type = 'sawtooth';
          const filter = this.ctx!.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(450, now);
          osc.connect(filter);
          filter.connect(gain);
        } else if (type === 'temple_harp') {
          osc.type = 'triangle';
          osc.connect(gain);
        } else if (type === 'solemn_choir') {
          osc.type = 'sine';
          const filter = this.ctx!.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(800, now);
          filter.Q.setValueAtTime(1.5, now);
          osc.connect(filter);
          filter.connect(gain);
        } else {
          osc.type = 'sine';
          osc.connect(gain);
        }

        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.06, now + 1.8);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.8);

        gain.connect(this.musicGainNode!);
        osc.start(now);
        osc.stop(now + 6.0);

        this.activeOscillators.push(osc);
      });
    };

    playChord();
    this.musicInterval = setInterval(playChord, 5200);
  }

  public duckMusic(isSpeaking: boolean) {
    if (!this.musicGainNode || !this.ctx) return;
    const targetGain = isSpeaking ? 0.06 : 0.22;
    this.musicGainNode.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGainNode.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.4);
  }

  public stopAtmosphere() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.activeOscillators.forEach((node) => {
      try {
        if ('stop' in node) (node as OscillatorNode).stop();
      } catch (e) {
        // Ignored
      }
    });
    this.activeOscillators = [];
  }

  public setMasterVolume(vol: number) {
    if (this.masterGainNode && this.ctx) {
      this.masterGainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  public setMusicVolume(vol: number) {
    if (this.musicGainNode && this.ctx) {
      this.musicGainNode.gain.setValueAtTime(vol * 0.25, this.ctx.currentTime);
    }
  }

  public stopVoice() {
    if (this.activeVoiceSource) {
      try {
        this.activeVoiceSource.stop();
        this.activeVoiceSource.disconnect();
      } catch (e) {
        // Ignored
      }
      this.activeVoiceSource = null;
    }
  }

  // Play realistic 16-bit PCM audio (from Gemini TTS) with warmth and acoustic presence
  public playPcmAudio(
    base64Data: string,
    sampleRate: number = 24000,
    volume: number = 1.0,
    warmFilter: boolean = true
  ): Promise<void> {
    this.stopVoice();
    const ctx = this.initContext();

    return new Promise((resolve) => {
      try {
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const int16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
          float32[i] = int16[i] / 32768;
        }

        const audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
        audioBuffer.copyToChannel(float32, 0);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        this.activeVoiceSource = source;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);

        if (warmFilter) {
          // Subtle warm acoustic broadcast EQ
          const lowShelf = ctx.createBiquadFilter();
          lowShelf.type = 'lowshelf';
          lowShelf.frequency.setValueAtTime(200, ctx.currentTime);
          lowShelf.gain.setValueAtTime(2.5, ctx.currentTime); // Rich chest resonance

          const highShelf = ctx.createBiquadFilter();
          highShelf.type = 'highshelf';
          highShelf.frequency.setValueAtTime(7000, ctx.currentTime);
          highShelf.gain.setValueAtTime(1.5, ctx.currentTime); // Radiance / presence

          source.connect(lowShelf);
          lowShelf.connect(highShelf);
          highShelf.connect(gainNode);
        } else {
          source.connect(gainNode);
        }

        gainNode.connect(this.masterGainNode || ctx.destination);

        source.onended = () => {
          this.activeVoiceSource = null;
          resolve();
        };

        source.start(0);
      } catch (err) {
        console.error('Failed to play PCM audio:', err);
        resolve();
      }
    });
  }

  public close() {
    this.stopVoice();
    this.stopAtmosphere();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// Convert AudioBuffer to standard 16-bit PCM WAV Blob
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);  // file length - 8
  setUint32(0x45564157); // "WAVE"

  // fmt sub-chunk
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16);         // SubChunk1Size (16 for PCM)
  setUint16(1);          // AudioFormat (1 = PCM)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2);              // block align
  setUint16(16);                         // bits per sample

  // data sub-chunk
  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4); // data chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

// Render the entire radio drama to an offline AudioBuffer and export to WAV
export async function renderDramaToWav(
  script: RadioDramaScript,
  settings: AudioMixerSettings,
  onProgress?: (percent: number, statusText: string) => void
): Promise<Blob> {
  const sampleRate = 44100;
  // Estimate duration: intro (10s) + lines (~3s per line avg) + outro (12s)
  const totalLines = script.lines.length;
  const estimatedSeconds = Math.max(30, totalLines * 4.5 + (settings.includeStationJingle ? 22 : 10));
  const offlineCtx = new OfflineAudioContext(2, Math.floor(sampleRate * estimatedSeconds), sampleRate);

  onProgress?.(10, 'Inicjalizacja ścieżek dźwiękowych Christian Culture...');

  let timeline = 0.5;

  // 1. Radio Station Intro Jingle
  if (settings.includeStationJingle) {
    onProgress?.(20, 'Generowanie dżingla radiowego stacji www.polskieradio.cc...');
    const jingleNotes = [349.23, 440.0, 523.25, 698.46];
    jingleNotes.forEach((freq, idx) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, timeline + idx * 0.35);

      gain.gain.setValueAtTime(0.0001, timeline + idx * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.35, timeline + idx * 0.35 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, timeline + idx * 0.35 + 1.2);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(timeline + idx * 0.35);
      osc.stop(timeline + idx * 0.35 + 1.3);
    });
    timeline += 2.5;
  }

  // 2. Procedural Background Music Track (Sacred Ambient Pad)
  if (settings.backgroundMusic !== 'none') {
    onProgress?.(35, 'Tworzenie tła symfonicznego i sakralnej aury...');
    const bgChordRoots = [146.83, 116.54, 130.81, 110.0];
    let bgTime = timeline;
    let chordCounter = 0;

    while (bgTime < estimatedSeconds - 4) {
      const root = bgChordRoots[chordCounter % bgChordRoots.length];
      const chord = [root, root * 1.5, root * 1.8];
      chord.forEach((freq) => {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        const filter = offlineCtx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, bgTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, bgTime);

        gain.gain.setValueAtTime(0.0001, bgTime);
        gain.gain.exponentialRampToValueAtTime(settings.musicVolume * 0.12, bgTime + 1.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, bgTime + 5.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(offlineCtx.destination);

        osc.start(bgTime);
        osc.stop(bgTime + 5.8);
      });
      bgTime += 5.0;
      chordCounter++;
    }
  }

  // 3. Audio Voice Lines Synthesis
  // Synthesize acoustic dialogue tone markers for each character role
  for (let i = 0; i < script.lines.length; i++) {
    const line = script.lines[i];
    const char = script.characters.find((c) => c.id === line.characterId);
    const percent = Math.floor(40 + (i / totalLines) * 45);
    onProgress?.(percent, `Reżyseria roli: ${line.characterName} (kwestia ${i + 1}/${totalLines})...`);

    // Add SFX if present in line
    if (line.sfxCue) {
      const sfxOsc = offlineCtx.createOscillator();
      const sfxGain = offlineCtx.createGain();
      sfxOsc.type = 'triangle';
      sfxOsc.frequency.setValueAtTime(523.25, timeline);
      sfxGain.gain.setValueAtTime(0.08 * settings.sfxVolume, timeline);
      sfxGain.gain.exponentialRampToValueAtTime(0.0001, timeline + 1.2);
      sfxOsc.connect(sfxGain);
      sfxGain.connect(offlineCtx.destination);
      sfxOsc.start(timeline);
      sfxOsc.stop(timeline + 1.3);
    }

    // Voice acoustic simulation tone
    const wordsCount = line.text.split(/\s+/).length;
    const duration = Math.max(2.2, wordsCount * 0.38);

    const basePitch = (char?.recommendedPitch || 1.0) * (char?.gender === 'female' ? 240 : char?.gender === 'divine' ? 110 : 160);
    const voiceOsc = offlineCtx.createOscillator();
    const voiceGain = offlineCtx.createGain();
    const voiceFilter = offlineCtx.createBiquadFilter();

    voiceOsc.type = 'triangle';
    voiceOsc.frequency.setValueAtTime(basePitch, timeline);
    voiceOsc.frequency.linearRampToValueAtTime(basePitch * 1.05, timeline + duration * 0.5);
    voiceOsc.frequency.linearRampToValueAtTime(basePitch * 0.96, timeline + duration);

    voiceFilter.type = 'bandpass';
    voiceFilter.frequency.setValueAtTime(basePitch * 2.2, timeline);
    voiceFilter.Q.setValueAtTime(2.5, timeline);

    voiceGain.gain.setValueAtTime(0.001, timeline);
    voiceGain.gain.exponentialRampToValueAtTime(0.18 * settings.voiceVolume, timeline + 0.1);
    voiceGain.gain.setValueAtTime(0.18 * settings.voiceVolume, timeline + duration - 0.2);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, timeline + duration);

    voiceOsc.connect(voiceFilter);
    voiceFilter.connect(voiceGain);
    voiceGain.connect(offlineCtx.destination);

    voiceOsc.start(timeline);
    voiceOsc.stop(timeline + duration);

    timeline += duration + ((line.pauseAfterMs || 600) / 1000);
  }

  // 4. Outro Station Jingle & Final Blessing
  if (settings.includeStationJingle) {
    onProgress?.(90, 'Końcowy dżingiel stacji i mastering emisyjny...');
    const outroNotes = [698.46, 523.25, 440.0, 349.23];
    outroNotes.forEach((freq, idx) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, timeline + idx * 0.4);

      gain.gain.setValueAtTime(0.0001, timeline + idx * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.3, timeline + idx * 0.4 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, timeline + idx * 0.4 + 1.5);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(timeline + idx * 0.4);
      osc.stop(timeline + idx * 0.4 + 1.6);
    });
    timeline += 3.0;
  }

  onProgress?.(95, 'Renderowanie mastera radiowego WAV (16-bit PCM)...');
  const renderedBuffer = await offlineCtx.startRendering();
  onProgress?.(100, 'Gotowe!');
  return audioBufferToWav(renderedBuffer);
}
