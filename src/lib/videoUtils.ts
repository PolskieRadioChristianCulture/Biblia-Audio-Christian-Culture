import JSZip from 'jszip';
import { ProductionProject, SubtitleCue, VideoScene, VideoSettings } from '../types';

export function createDefaultVideoSettings(
  bookName = 'Ewangelia wg św. Łukasza',
  chapterNumber: string | number = '15'
): VideoSettings {
  return {
    mode: 'radio',
    resolution: '1080p',
    visualizer: 'pulsing_glow',
    artStyle: 'painterly_illustration',
    motionEffect: 'slow_zoom_in',
    fps: 25,
    showSubtitles: true,
    showVerseNumbers: true,
    subtitlesPosition: 'bottom',
    subtitlesFontSize: 'normal',
    showLogo: true,
    logoPosition: 'top_right',
    includeIntro: true,
    introDurationSec: 5,
    introTitle: 'BIBLIA AUDIO',
    introSlogan: 'Christian Culture • www.polskieradio.cc',
    includeOutro: true,
    outroDurationSec: 6,
    outroTitle: 'Christian Culture',
    outroText: 'Słowo, które możesz usłyszeć',
    outroStationUrl: 'www.polskieradio.cc',
    selectedThumbnailTemplate: 0,
    scenes: [
      {
        id: 'scene_1',
        sceneNumber: 1,
        title: `${bookName} ${chapterNumber}`,
        startSec: 0,
        durationSec: 30,
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Rembrandt_Harmensz_van_Rijn_-_Return_of_the_Prodigal_Son_-_Google_Art_Project.jpg/1280px-Rembrandt_Harmensz_van_Rijn_-_Return_of_the_Prodigal_Son_-_Google_Art_Project.jpg',
        imagePrompt:
          'Rembrandt chiaroscuro sacred biblical art, Judean historical setting, warm oil textures, golden sacred light',
        imageSource: 'Domena publiczna: Rembrandt van Rijn',
        author: 'Rembrandt van Rijn',
        license: 'Public Domain',
        rightsConfirmed: true,
        motionType: 'slow_zoom_in',
      },
    ],
  };
}

/**
 * Formats seconds into SRT timestamp format: HH:MM:SS,mmm
 */
export function formatSrtTime(totalSec: number): string {
  const safe = Math.max(0, totalSec);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = Math.floor(safe % 60);
  const ms = Math.floor((safe % 1) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(ms, 3)}`;
}

/**
 * Formats seconds into WebVTT timestamp format: HH:MM:SS.mmm
 */
export function formatVttTime(totalSec: number): string {
  return formatSrtTime(totalSec).replace(',', '.');
}

/**
 * Formats seconds into YouTube chapter format: MM:SS or HH:MM:SS
 */
export function formatYouTubeTime(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Generates an official SRT subtitles file content
 */
export function generateSrt(subtitles: SubtitleCue[], includeVerse = true): string {
  return subtitles
    .map((cue, index) => {
      const verseTag = includeVerse && cue.verseRef ? `[${cue.verseRef}] ` : '';
      const speakerTag = cue.characterName ? `${cue.characterName}: ` : '';
      return `${index + 1}\n${formatSrtTime(cue.startSec)} --> ${formatSrtTime(cue.endSec)}\n${verseTag}${speakerTag}${cue.text}\n`;
    })
    .join('\n');
}

/**
 * Generates an official WebVTT subtitles file content
 */
export function generateVtt(subtitles: SubtitleCue[], includeVerse = true): string {
  const body = subtitles
    .map((cue, index) => {
      const verseTag = includeVerse && cue.verseRef ? `[${cue.verseRef}] ` : '';
      const speakerTag = cue.characterName ? `${cue.characterName}: ` : '';
      return `${index + 1}\n${formatVttTime(cue.startSec)} --> ${formatVttTime(cue.endSec)}\n${verseTag}${speakerTag}${cue.text}\n`;
    })
    .join('\n');

  return `WEBVTT - Biblia Audio Christian Culture (www.polskieradio.cc)\n\n${body}`;
}

/**
 * Calculates subtitle cues based on script lines, actual clip durations and pause timings
 */
export function calculateSubtitleCues(
  project: ProductionProject,
  introDurationSec = 0
): SubtitleCue[] {
  const lines = project.script?.lines || [];
  const clips = project.generatedClips || [];

  let currentSec = introDurationSec;
  const cues: SubtitleCue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const clip = clips.find((c) => c.lineId === line.id);
    // Determine duration: from clip if exists, or approximate from word count (approx 3.2 words/sec)
    const wordCount = line.text.split(/\s+/).filter(Boolean).length;
    const duration = clip?.durationSec && clip.durationSec > 0
      ? clip.durationSec
      : Math.max(1.8, wordCount / 3.0);

    const startSec = currentSec;
    const endSec = startSec + duration;

    cues.push({
      id: `cue_${line.id}`,
      lineId: line.id,
      verseRef: line.verseRef || '',
      characterName: line.characterName,
      text: line.text,
      startSec,
      endSec,
    });

    // Advance time including pause
    const pauseSec = (line.pauseAfterMs || 700) / 1000;
    currentSec = endSec + pauseSec;
  }

  return cues;
}

/**
 * Generates official YouTube chapter timestamps list
 */
export function generateYouTubeTimestamps(
  scenes: VideoScene[],
  includeIntro = true,
  introSec = 6
): string {
  const lines: string[] = [];

  if (includeIntro) {
    lines.push(`00:00 Wprowadzenie • Biblia Audio Christian Culture`);
    scenes.forEach((sc, idx) => {
      const time = formatYouTubeTime(sc.startSec + introSec);
      lines.push(`${time} ${sc.title || `Scena ${idx + 1}`}`);
    });
  } else {
    scenes.forEach((sc, idx) => {
      const time = formatYouTubeTime(sc.startSec);
      lines.push(`${time} ${sc.title || `Scena ${idx + 1}`}`);
    });
  }

  return lines.join('\n');
}

/**
 * Generates complete YouTube video description with timestamps, Bible attribution, CC links and hashtags
 */
export function generateYouTubeDescription(project: ProductionProject): string {
  const videoSettings = project.videoSettings || createDefaultVideoSettings(project.bookName, project.chapterNumber);
  const title = `${project.bookName} — Rozdział ${project.chapterNumber} | Biblia Audio Christian Culture`;
  const timestamps = generateYouTubeTimestamps(
    videoSettings.scenes || [],
    videoSettings.includeIntro,
    videoSettings.introDurationSec
  );

  return `${title}
Słuchowisko radiowe Christian Culture — Słowo, które możesz usłyszeć.

🎧 Słuchaj całodobowego Radia Christian Culture: https://www.polskieradio.cc
📖 Pismo Święte: ${project.bookName}, Rozdział ${project.chapterNumber}
📜 Przekład: ${project.translation || 'Przekład z domeny publicznej'}
🏛️ Źródło tekstu: ${project.sourceType === 'public_domain' ? 'Tekst z domeny publicznej (nienaruszony)' : 'Licencjonowany materiał biblijny'}
🎙️ Produkcja: Biblia Audio Studio • Christian Culture

⏱️ ROZDZIAŁY CZASOWE (TIMESTAMPS):
${timestamps}

🌟 O PROJEKCIE BIBLIA AUDIO CHRISTIAN CULTURE:
„Wiara rodzi się z tego, co się słyszy, tym zaś, co się słyszy, jest słowo Chrystusa” (Rz 10,17).
Oficjalne słuchowisko stacji radiowej Christian Culture (polskieradio.cc) przygotowane z dbałością o nienaruszalność i powagę Słowa Bożego. Wszystkie kwestie wypowiadane są wiernie werset po wersecie, z profesjonalnym masteringiem emisyjnym i filmową oprawą dźwiękową.

🔔 SUBSKRYBUJ KANAŁ I WŁĄCZ POWIADOMIENIA, aby nie przegapić kolejnych rozdziałów Pisma Świętego!
➡️ Następny rozdział już wkrótce na naszym kanale oraz na antenie www.polskieradio.cc.

📌 PRZYPIĘTY KOMENTARZ:
„Dziękujemy za wspólne słuchanie Słowa Bożego! Który werset z tego rozdziału szczególnie poruszył Twoje serce? Podziel się w komentarzu i posłuchaj pełnej audycji w Radiu Christian Culture na https://www.polskieradio.cc 🙏”

#BibliaAudio #ChristianCulture #PismoŚwięte #${project.bookName.replace(/\s+/g, '')} #Biblia #PolskieRadioCC #Ewangelia #Słuchowisko`;
}

/**
 * Creates and downloads a complete ZIP publication bundle with all materials
 */
export async function downloadPublicationZipBundle(
  project: ProductionProject,
  thumbnailBlob?: Blob,
  onProgress?: (msg: string) => void
): Promise<void> {
  onProgress?.('Przygotowywanie plików pakietu publikacyjnego...');
  const zip = new JSZip();
  const videoSettings = project.videoSettings || createDefaultVideoSettings(project.bookName, project.chapterNumber);

  const folderName = `${project.bookName}_Rozdzial_${project.chapterNumber}_Christian_Culture`.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const root = zip.folder(folderName) || zip;

  // 1. Subtitles
  const cues = calculateSubtitleCues(project, videoSettings.includeIntro ? videoSettings.introDurationSec : 0);
  const srtContent = generateSrt(cues, videoSettings.showVerseNumbers);
  const vttContent = generateVtt(cues, videoSettings.showVerseNumbers);
  root.file('napisy.srt', srtContent);
  root.file('napisy.vtt', vttContent);

  // 2. YouTube Metadata & Descriptions
  const ytDesc = generateYouTubeDescription(project);
  root.file('opis_youtube.txt', ytDesc);

  const timestamps = generateYouTubeTimestamps(
    videoSettings.scenes || [],
    videoSettings.includeIntro,
    videoSettings.introDurationSec
  );
  root.file('znaczniki_czasowe.txt', timestamps);

  // 3. Project Metadata JSON
  const metaJson = JSON.stringify(
    {
      title: project.title,
      bookName: project.bookName,
      chapterNumber: project.chapterNumber,
      translation: project.translation,
      stationBrand: 'Christian Culture (www.polskieradio.cc)',
      audioSpecs: {
        formatMaster: 'WAV 48kHz / 24-bit PCM / -16 LUFS',
        formatPodcast: 'MP3 192kbps / 44.1kHz Stereo',
      },
      videoSpecs: {
        mode: project.videoSettings.mode,
        resolution: project.videoSettings.resolution,
        fps: project.videoSettings.fps,
        format: 'MP4 (H.264 / AAC 48kHz)',
      },
      characters: project.script?.characters || [],
      characterProfiles: project.characterProfiles || [],
      scenes: project.videoSettings.scenes,
      generatedAt: new Date().toISOString(),
    },
    null,
    2
  );
  root.file('projekt_metadane.json', metaJson);

  // 4. Thumbnail if provided
  if (thumbnailBlob) {
    root.file('miniatura_youtube_1280x720.png', thumbnailBlob);
  }

  // 5. Generate and trigger download
  onProgress?.('Kompresowanie archiwum ZIP...');
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderName}_Pakiet_Publikacyjny.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
