import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Step1TextInput } from './components/Step1TextInput';
import { Step2Analyze } from './components/Step2Analyze';
import { Step3ScriptEditor } from './components/Step3ScriptEditor';
import { Step4Casting } from './components/Step4Casting';
import { Step5Direction } from './components/Step5Direction';
import { Step6Timeline } from './components/Step6Timeline';
import { Step7VideoStudio } from './components/Step7VideoStudio';
import { Step8ExportPublish } from './components/Step8ExportPublish';
import { StepPageLayout } from './components/StepPageLayout';
import { ProjectsManagerModal } from './components/ProjectsManagerModal';
import { AuditionModal } from './components/AuditionModal';
import { DEMO_SCRIPTS } from './data/presets';
import { DEFAULT_CHARACTER_PROFILES } from './data/videoPresets';
import { createDefaultVideoSettings, calculateSubtitleCues } from './lib/videoUtils';
import { DramaCharacter, DramaLine, GeneratedAudioClip, ProductionProject, VideoSettings } from './types';
import { pcm16Base64ToWavUrl } from './lib/audioUtils';

const STORAGE_KEY = 'biblia_audio_studio_projects';

export default function App() {
  // Projects State
  const [projects, setProjects] = useState<ProductionProject[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p) => ({
            ...p,
            videoSettings: p.videoSettings || createDefaultVideoSettings(p.bookName, p.chapterNumber),
            characterProfiles: p.characterProfiles || DEFAULT_CHARACTER_PROFILES,
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to load stored projects:', e);
    }

    // Default initial project with Luke 15 demo
    const demo = DEMO_SCRIPTS.prodigal_son;
    const defaultProj: ProductionProject = {
      id: 'proj_luke_15_demo',
      title: 'Przypowieść o Synu Marnotrawnym (Łk 15)',
      bookName: 'Ewangelia wg św. Łukasza',
      chapterNumber: '15',
      translation: 'Przekład z domeny publicznej (Biblia Gdańska / Wujka)',
      language: 'pl',
      sourceType: 'public_domain',
      rightsConfirmed: true,
      rawSourceText: demo.lines.map((l) => l.originalVerbatimText || l.text).join('\n\n'),
      status: 'analyzed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      script: demo,
      mixerSettings: {
        mode: 'radio_drama',
        voiceVolume: 100,
        musicVolume: 35,
        sfxVolume: 40,
        reverbLevel: 15,
        stereoWidth: 80,
        speechRate: 1.0,
        wordClarityPriority: true,
        enableIntroOutro: true,
        radioTubeWarmth: true,
      },
      generatedClips: [],
      videoSettings: createDefaultVideoSettings('Ewangelia wg św. Łukasza', '15'),
      characterProfiles: DEFAULT_CHARACTER_PROFILES,
    };
    return [defaultProj];
  });

  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    return projects[0]?.id || 'proj_luke_15_demo';
  });

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Audition Modal State
  const [auditionModal, setAuditionModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    text: string;
    audioUrl: string | null;
    isLoading: boolean;
    voiceName: string;
    playbackRate?: number;
    emotionCue?: string;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    text: '',
    audioUrl: null,
    isLoading: false,
    voiceName: 'Kore',
    playbackRate: 1.0,
    emotionCue: '',
  });

  // Batch Synthesis & Master Render State
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisProgress, setSynthesisProgress] = useState({
    current: 0,
    total: 0,
    currentSpeaker: '',
  });
  const [isRenderingMaster, setIsRenderingMaster] = useState(false);
  const [isPlaying] = useState(false);

  // Video Studio Render State
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [videoRenderProgress, setVideoRenderProgress] = useState<{ stage: string; percent: number }>({
    stage: '',
    percent: 0,
  });

  // Sync projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Failed to save projects to localStorage:', e);
    }
  }, [projects]);

  const currentProject =
    projects.find((p) => p.id === currentProjectId) || projects[0];

  const updateCurrentProject = (updatedFields: Partial<ProductionProject>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === currentProjectId) {
          return {
            ...p,
            ...updatedFields,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  };

  // Project Actions
  const handleNewProject = () => {
    const newId = `proj_${Date.now()}`;
    const newProj: ProductionProject = {
      id: newId,
      title: 'Nowe Słuchowisko Biblijne',
      bookName: '',
      chapterNumber: '1',
      translation: 'Przekład z domeny publicznej',
      language: 'pl',
      sourceType: 'public_domain',
      rightsConfirmed: false,
      rawSourceText: '',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      script: {
        title: 'Nowe Słuchowisko Biblijne',
        bibleReference: '',
        estimatedDurationMinutes: 0,
        stationIntro: 'Biblia Audio Christian Culture. Słowo, które możesz usłyszeć na polskieradio.cc.',
        stationOutro: 'Słuchałeś Biblii Audio Christian Culture. Więcej na polskieradio.cc.',
        atmosphereMood: 'Spokojna narracja radiowa',
        characters: [],
        lines: [],
        podcastMetadata: {
          episodeTitle: 'Nowe Słuchowisko Biblijne',
          seriesName: 'Biblia Audio Christian Culture',
          episodeNumber: 1,
          author: 'Christian Culture',
          description: 'Słuchowisko biblijne stacji Christian Culture.',
          summary: 'Opis audycji biblijnej.',
          bookAndChapter: '',
          translationUsed: '',
          sourceAttribution: 'Tekst nienaruszony — Christian Culture www.polskieradio.cc',
          characterList: [],
          keywords: ['Biblia Audio', 'Christian Culture'],
          youtubeDescription: 'Słuchowisko biblijne Christian Culture.',
          podcastRssDescription: 'Biblia Audio Christian Culture.',
          socialPostDraft: 'Zapraszamy do wysłuchania!',
        },
      },
      mixerSettings: {
        mode: 'radio_broadcast',
        voiceVolume: 100,
        musicVolume: 30,
        sfxVolume: 35,
        reverbLevel: 15,
        stereoWidth: 70,
        speechRate: 1.0,
        wordClarityPriority: true,
        enableIntroOutro: true,
        radioTubeWarmth: true,
      },
      generatedClips: [],
      videoSettings: createDefaultVideoSettings('Księga Rodzaju', '1'),
      characterProfiles: DEFAULT_CHARACTER_PROFILES,
    };
    setProjects((prev) => [newProj, ...prev]);
    setCurrentProjectId(newId);
    setCurrentStep(1);
  };

  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) {
      alert('Nie możesz usunąć jedynego projektu. Utwórz najpierw nowy.');
      return;
    }
    const remaining = projects.filter((p) => p.id !== projectId);
    setProjects(remaining);
    if (currentProjectId === projectId) {
      setCurrentProjectId(remaining[0].id);
    }
  };

  const handleDuplicateProject = (proj: ProductionProject) => {
    const dupId = `proj_${Date.now()}`;
    const duplicate: ProductionProject = {
      ...proj,
      id: dupId,
      title: `${proj.title} (Kopia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => [duplicate, ...prev]);
    setCurrentProjectId(dupId);
  };

  // Audition Voice or Line
  const handleAuditionVoice = async (char: DramaCharacter) => {
    const sampleText = `Słuchają Państwo Radia Christian Culture. Mówi postać: ${char.name}. ${char.voiceProfile || 'Słowo Boże trwa na wieki.'}`;
    setAuditionModal({
      isOpen: true,
      title: `Próbka głosu: ${char.name}`,
      subtitle: `Głos Gemini TTS: ${char.geminiVoice || 'Kore'} (${char.roleType || 'aktor'})`,
      text: sampleText,
      audioUrl: null,
      isLoading: true,
      voiceName: char.geminiVoice || 'Kore',
    });

    try {
      const res = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          voiceName: char.geminiVoice || 'Kore',
        }),
      });
      const data = await res.json();
      if (data.success && data.audioBase64) {
        const wavUrl = pcm16Base64ToWavUrl(data.audioBase64, data.sampleRate || 24000);
        setAuditionModal((prev) => ({
          ...prev,
          audioUrl: wavUrl,
          isLoading: false,
        }));
      } else {
        throw new Error(data.error || 'Błąd generowania próbki');
      }
    } catch (e: any) {
      alert(e.message || 'Nie udało się wygenerować próbki głosu.');
      setAuditionModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleAuditionLine = async (line: DramaLine) => {
    const char = currentProject.script?.characters.find((c) => c.id === line.characterId);
    const voiceName = char?.geminiVoice || 'Kore';
    const rate = line.tempoMultiplier || 1.0;

    setAuditionModal({
      isOpen: true,
      title: `Odsłuch kwestii: ${line.characterName}`,
      subtitle: `${line.verseRef || ''} ${line.emotionCue || ''}`,
      text: line.text,
      audioUrl: null,
      isLoading: true,
      voiceName,
      playbackRate: rate,
      emotionCue: line.emotionCue,
    });

    try {
      const res = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: line.text,
          voiceName,
        }),
      });
      const data = await res.json();
      if (data.success && data.audioBase64) {
        const wavUrl = pcm16Base64ToWavUrl(data.audioBase64, data.sampleRate || 24000);
        setAuditionModal((prev) => ({
          ...prev,
          audioUrl: wavUrl,
          isLoading: false,
        }));
      } else {
        throw new Error(data.error || 'Błąd generowania kwestii');
      }
    } catch (e: any) {
      alert(e.message || 'Nie udało się wygenerować kwestii.');
      setAuditionModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Synthesize all voices sequentially with progress
  const handleSynthesizeAllVoices = async () => {
    const lines = currentProject.script?.lines || [];
    if (lines.length === 0) return;

    setIsSynthesizing(true);
    const characters = currentProject.script?.characters || [];
    const updatedClips: GeneratedAudioClip[] = [...(currentProject.generatedClips || [])];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const char = characters.find((c) => c.id === line.characterId);
      const voiceName = char?.geminiVoice || 'Kore';

      setSynthesisProgress({
        current: i + 1,
        total: lines.length,
        currentSpeaker: `${line.characterName} (${voiceName})`,
      });

      // Check if already in clips
      const existing = updatedClips.find((c) => c.lineId === line.id && c.audioBase64);
      if (!existing) {
        try {
          const res = await fetch('/api/tts/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: line.text,
              voiceName,
            }),
          });
          const data = await res.json();
          if (data.success && data.audioBase64) {
            const wavUrl = pcm16Base64ToWavUrl(data.audioBase64, data.sampleRate || 24000);
            updatedClips.push({
              lineId: line.id,
              characterId: line.characterId,
              audioBase64: data.audioBase64,
              audioUrl: wavUrl,
              durationSec: data.audioBase64.length / 48000,
            });
          }
        } catch (err) {
          console.error(`Error synthesizing line ${line.id}:`, err);
        }
      }
    }

    updateCurrentProject({
      generatedClips: updatedClips,
      status: 'approved',
    });
    setIsSynthesizing(false);
  };

  // Render Master Audio via FFmpeg
  const handleRenderMasterAudio = async () => {
    const lines = currentProject.script?.lines || [];
    const clips = currentProject.generatedClips || [];

    if (clips.length === 0) {
      alert('Najpierw wygeneruj głosy AI klikając przycisk „Wygeneruj wszystkie głosy AI”.');
      return;
    }

    setIsRenderingMaster(true);
    try {
      // Map clips in order of lines
      const orderedClips = lines.map((line) => {
        const foundClip = clips.find((c) => c.lineId === line.id);
        return {
          base64: foundClip?.audioBase64 || '',
          pauseAfterMs: line.pauseAfterMs || 700,
        };
      });

      const res = await fetch('/api/audio/render-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: currentProject.title,
          script: currentProject.script,
          clips: orderedClips,
          mixerSettings: currentProject.mixerSettings,
        }),
      });

      const data = await res.json();
      const wavUrl = data.wavUrl || data.wavDownloadUrl;
      const mp3Url = data.mp3Url || data.mp3DownloadUrl;

      if (data.success && wavUrl) {
        updateCurrentProject({
          masterAudioWavUrl: wavUrl,
          masterAudioMp3Url: mp3Url,
          status: 'ready',
        });
      } else {
        throw new Error(data.error || 'Nie udało się zmontować audycji.');
      }
    } catch (e: any) {
      alert(e.message || 'Wystąpił błąd podczas montażu mastera audio.');
    } finally {
      setIsRenderingMaster(false);
    }
  };

  // Render MP4 Video via FFmpeg
  const handleRenderVideo = async (videoSettings: VideoSettings) => {
    setIsRenderingVideo(true);
    setVideoRenderProgress({ stage: 'Przygotowywanie ścieżki dźwiękowej i plansz...', percent: 20 });
    try {
      const subtitleCues = calculateSubtitleCues(
        currentProject,
        videoSettings.includeIntro ? videoSettings.introDurationSec : 0
      );

      setVideoRenderProgress({ stage: 'Synchronizacja osi czasu i napisów...', percent: 45 });

      const orderedClips = (currentProject.script?.lines || []).map((line) => {
        const foundClip = currentProject.generatedClips?.find((c) => c.lineId === line.id);
        return {
          base64: foundClip?.audioBase64 || '',
          pauseAfterMs: line.pauseAfterMs || 700,
        };
      });

      setVideoRenderProgress({
        stage: 'Uruchamianie silnika wideo FFmpeg (H.264 Full HD / Shorts)...',
        percent: 70,
      });

      const res = await fetch('/api/video/render-mp4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: currentProject.title,
          bookName: currentProject.bookName,
          chapterNumber: currentProject.chapterNumber,
          videoSettings,
          subtitles: subtitleCues,
          clips: orderedClips,
        }),
      });

      setVideoRenderProgress({ stage: 'Weryfikacja kontenera MP4 i strumienia AAC...', percent: 90 });
      const data = await res.json();
      if (data.success && data.mp4Url) {
        updateCurrentProject({
          renderedVideoMp4Url: data.mp4Url,
          renderedVideoStatus: 'ready',
          renderedVideoSpecs: {
            resolution: data.resolution,
            durationSec: data.durationSeconds,
            fileSizeBytes: data.fileSizeBytes,
            fps: videoSettings.fps || 25,
          },
        });
        setVideoRenderProgress({ stage: 'Film wyrenderowany pomyślnie!', percent: 100 });
      } else {
        throw new Error(data.error || 'Błąd renderowania filmu wideo.');
      }
    } catch (err: any) {
      alert(err.message || 'Wystąpił błąd podczas generowania wideo.');
    } finally {
      setIsRenderingVideo(false);
    }
  };

  return (
    <div
      id="biblia-audio-app"
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        highContrast ? 'bg-black text-white' : 'bg-stone-950 text-stone-100'
      }`}
    >
      {/* Station Header */}
      <Header
        currentStep={currentStep}
        onSelectStep={(step) => setCurrentStep(step)}
        projectStatus={currentProject.status}
        projectTitle={currentProject.title}
        onOpenProjects={() => setIsProjectsModalOpen(true)}
        onNewProject={handleNewProject}
        isPlaying={isPlaying}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
      />

      {/* Main Studio Viewport: One Step = One Dedicated Page */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <StepPageLayout
          currentStep={currentStep}
          project={currentProject}
          onSelectStep={(step) => setCurrentStep(step)}
        >
          {currentStep === 1 && (
            <Step1TextInput
              project={currentProject}
              onUpdateProject={updateCurrentProject}
              onProceedToAnalyze={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <Step2Analyze
              project={currentProject}
              onUpdateProject={updateCurrentProject}
              onProceedToScript={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 3 && (
            <Step3ScriptEditor
              project={currentProject}
              onUpdateProject={updateCurrentProject}
              onAuditionLine={handleAuditionLine}
              onProceedToCasting={() => setCurrentStep(4)}
            />
          )}

          {currentStep === 4 && (
            <Step4Casting
              project={currentProject}
              onUpdateProject={updateCurrentProject}
              onAuditionVoice={handleAuditionVoice}
              onProceedToDirection={() => setCurrentStep(5)}
            />
          )}

          {currentStep === 5 && (
            <Step5Direction
              project={currentProject}
              onUpdateProject={updateCurrentProject}
              onProceedToTimeline={() => setCurrentStep(6)}
              onAuditionLine={handleAuditionLine}
            />
          )}

          {currentStep === 6 && (
            <Step6Timeline
              project={currentProject}
              onUpdateProject={updateCurrentProject}
              onProceedToVideo={() => setCurrentStep(7)}
              onProceedToExport={() => setCurrentStep(8)}
              onSynthesizeAllVoices={handleSynthesizeAllVoices}
              onRenderMasterAudio={handleRenderMasterAudio}
              isSynthesizing={isSynthesizing}
              synthesisProgress={synthesisProgress}
              isRenderingMaster={isRenderingMaster}
            />
          )}

          {currentStep === 7 && (
            <Step7VideoStudio
              project={currentProject}
              onUpdateProject={updateCurrentProject}
              onRenderVideo={handleRenderVideo}
              isRendering={isRenderingVideo}
              renderProgress={videoRenderProgress}
              onProceedToExport={() => setCurrentStep(8)}
            />
          )}

          {currentStep === 8 && <Step8ExportPublish project={currentProject} />}
        </StepPageLayout>
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-stone-800/80 bg-stone-950/80 py-6 text-xs text-stone-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <span className="font-serif font-bold text-amber-300 uppercase tracking-wider">
              Christian Culture
            </span>{' '}
            • Biblia Audio Studio • Główny adres marki:{' '}
            <a
              href="https://www.polskieradio.cc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline font-semibold"
            >
              www.polskieradio.cc
            </a>
          </div>
          <div className="flex items-center gap-4 text-stone-400 text-[11px]">
            <span>Standard emisyjny: WAV 48kHz / -16 LUFS</span>
            <span>•</span>
            <span>Gemini Neural TTS HD</span>
          </div>
        </div>
      </footer>

      {/* Projects Manager Modal ("Moje produkcje") */}
      <ProjectsManagerModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={(proj) => {
          setCurrentProjectId(proj.id);
          setCurrentStep(1);
        }}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
        onImportProjectJson={(importedProj) => {
          setProjects((prev) => [importedProj, ...prev]);
          setCurrentProjectId(importedProj.id);
          setCurrentStep(1);
        }}
      />

      {/* Audition Modal */}
      <AuditionModal
        isOpen={auditionModal.isOpen}
        onClose={() => setAuditionModal((prev) => ({ ...prev, isOpen: false }))}
        title={auditionModal.title}
        subtitle={auditionModal.subtitle}
        text={auditionModal.text}
        audioUrl={auditionModal.audioUrl}
        isLoading={auditionModal.isLoading}
        playbackRate={auditionModal.playbackRate}
        emotionCue={auditionModal.emotionCue}
        onReplay={() => {
          if (auditionModal.audioUrl) {
            const a = new Audio(auditionModal.audioUrl);
            if (auditionModal.playbackRate) {
              a.playbackRate = auditionModal.playbackRate;
            }
            a.play();
          }
        }}
      />
    </div>
  );
}
