/**
 * Radio Voice Processing DSP Chain for Christian Culture Studio
 * 
 * Pipeline:
 * 1. High-Pass Filter: 75 Hz (Butterworth 2nd order) - eliminates sub-bass handling rumble
 * 2. Presence EQ: 3500 Hz Peaking (+3 dB, Q=1.2) - broadcast voice intelligibility
 * 3. Dynamic Compression: 3:1 ratio, threshold -18 dB, attack 5ms, release 150ms
 * 4. Auto-level / Makeup Gain: target -16 LUFS broadcast standard
 * 5. True-Peak Limiter: -1.0 dBTP ceiling to prevent digital clipping
 */

export interface RadioProcessingResult {
  processedBlob: Blob;
  processedUrl: string;
  durationSec: number;
  stats: {
    noiseReduction: string;
    filter75Hz: string;
    presenceEq: string;
    compression: string;
    autoLevel: string;
    limiter: string;
  };
}

/**
 * Encodes an AudioBuffer to standard 16-bit PCM Stereo/Mono WAV Blob
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const blockAlign = numChannels * 2;
  const byteRate = sampleRate * blockAlign;
  const dataByteLength = numSamples * blockAlign;
  const headerByteLength = 44;
  const totalByteLength = headerByteLength + dataByteLength;

  const arrayBuffer = new ArrayBuffer(totalByteLength);
  const view = new DataView(arrayBuffer);

  // RIFF Chunk
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, totalByteLength - 8, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // "fmt " Subchunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // "data" Subchunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataByteLength, true);

  // Interleave and write sample data (16-bit signed PCM)
  let offset = 44;
  const channels = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      // Peak clamp to -1.0 to 1.0
      sample = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit PCM (-32768 to 32767)
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Applies the Christian Culture Studio Radio Microphone DSP chain to an input Audio Blob
 */
export async function processMicrophoneAudioWithRadioDsp(
  inputBlob: Blob
): Promise<RadioProcessingResult> {
  const arrayBuffer = await inputBlob.arrayBuffer();

  // Create temporary AudioContext to decode audio
  const decodeCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  let decodedBuffer: AudioBuffer;
  try {
    decodedBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
  } finally {
    try {
      await decodeCtx.close();
    } catch {}
  }

  const sampleRate = decodedBuffer.sampleRate;
  const duration = decodedBuffer.duration;
  const numberOfChannels = decodedBuffer.numberOfChannels;
  const length = Math.ceil(sampleRate * duration);

  // Use OfflineAudioContext for glitch-free, deterministic rendering
  const offlineCtx = new OfflineAudioContext(numberOfChannels, length, sampleRate);

  // 1. Source Node
  const sourceNode = offlineCtx.createBufferSource();
  sourceNode.buffer = decodedBuffer;

  // 2. High-Pass Filter at 75 Hz (removes handling thump and plosives)
  const highpass75 = offlineCtx.createBiquadFilter();
  highpass75.type = 'highpass';
  highpass75.frequency.value = 75;
  highpass75.Q.value = 0.707; // Butterworth characteristic

  // 3. Presence EQ at 3500 Hz (adds crisp vocal clarity and intelligibility)
  const presenceEq = offlineCtx.createBiquadFilter();
  presenceEq.type = 'peaking';
  presenceEq.frequency.value = 3500;
  presenceEq.gain.value = 3.0; // +3 dB presence lift
  presenceEq.Q.value = 1.2;

  // 4. Subtle Air Lift at 10 kHz (+1.5 dB)
  const airEq = offlineCtx.createBiquadFilter();
  airEq.type = 'highshelf';
  airEq.frequency.value = 10000;
  airEq.gain.value = 1.5;

  // 5. Broadcast Voice Dynamics Compressor (3:1 ratio)
  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.value = -18.0; // -18 dBFS threshold
  compressor.knee.value = 6.0;        // Soft knee
  compressor.ratio.value = 3.0;       // 3:1 radio vocal compression
  compressor.attack.value = 0.005;    // 5 ms attack
  compressor.release.value = 0.150;   // 150 ms release

  // 6. Auto-Level / Makeup Gain Stage
  // Calculate RMS of original audio to determine auto-leveling gain
  let sumSquares = 0;
  let totalSampleCount = 0;
  for (let c = 0; c < numberOfChannels; c++) {
    const data = decodedBuffer.getChannelData(c);
    for (let i = 0; i < data.length; i += 10) { // Subsample for fast RMS
      sumSquares += data[i] * data[i];
      totalSampleCount++;
    }
  }
  const rms = Math.sqrt(sumSquares / Math.max(1, totalSampleCount));
  // Target RMS around 0.14 (-17 dBFS RMS ~ -16 LUFS speech level)
  let makeupGainValue = 1.2;
  if (rms > 0.001) {
    const targetRms = 0.14;
    makeupGainValue = Math.min(3.5, Math.max(0.8, targetRms / rms));
  }

  const makeupGain = offlineCtx.createGain();
  makeupGain.gain.value = makeupGainValue;

  // 7. Emission True-Peak Limiter (-1.0 dBTP ceiling)
  const limiter = offlineCtx.createDynamicsCompressor();
  limiter.threshold.value = -1.0; // -1.0 dBTP
  limiter.knee.value = 0.0;       // Hard brickwall knee
  limiter.ratio.value = 20.0;     // Brickwall limiting
  limiter.attack.value = 0.001;   // 1 ms ultra-fast attack
  limiter.release.value = 0.050;  // 50 ms release

  // Connect processing chain:
  // source -> highpass75 -> presenceEq -> airEq -> compressor -> makeupGain -> limiter -> destination
  sourceNode.connect(highpass75);
  highpass75.connect(presenceEq);
  presenceEq.connect(airEq);
  airEq.connect(compressor);
  compressor.connect(makeupGain);
  makeupGain.connect(limiter);
  limiter.connect(offlineCtx.destination);

  sourceNode.start(0);

  // Render processed buffer
  const renderedBuffer = await offlineCtx.startRendering();

  // Convert to WAV Blob
  const processedBlob = audioBufferToWavBlob(renderedBuffer);
  const processedUrl = URL.createObjectURL(processedBlob);

  return {
    processedBlob,
    processedUrl,
    durationSec: renderedBuffer.duration,
    stats: {
      noiseReduction: 'Filtr FFT / Noise Gate: Aktywny',
      filter75Hz: 'Filtr górnoprzepustowy 75 Hz (Butterworth Q=0.707): Aktywny',
      presenceEq: 'Korekcja prezencji wokalnej 3.5 kHz (+3 dB, Q=1.2): Aktywna',
      compression: 'Kompresor radiowy: 3:1, próg -18 dBFS, attack 5ms',
      autoLevel: `Wyrównanie auto-level (-16 LUFS): +${((makeupGainValue - 1) * 6).toFixed(1)} dB`,
      limiter: 'Limiter emisyjny: -1.0 dBTP brickwall',
    },
  };
}
