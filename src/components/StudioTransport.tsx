import React from 'react';
import { Activity, AudioWaveform, CircleDot, Film, Gauge, Radio, ShieldCheck } from 'lucide-react';
import { ProductionProject } from '../types';

interface StudioTransportProps {
  project: ProductionProject;
  currentStep: number;
  isSynthesizing: boolean;
  isRenderingMaster: boolean;
  isRenderingVideo: boolean;
}

export const StudioTransport: React.FC<StudioTransportProps> = ({
  project,
  currentStep,
  isSynthesizing,
  isRenderingMaster,
  isRenderingVideo,
}) => {
  const busyLabel = isSynthesizing
    ? 'GENEROWANIE GŁOSÓW'
    : isRenderingMaster
      ? 'MASTERING AUDIO'
      : isRenderingVideo
        ? 'RENDER WIDEO'
        : 'STUDIO GOTOWE';
  const clips = project.generatedClips?.length || 0;
  const lines = project.script?.lines?.length || 0;

  return (
    <section className="studio-transport" aria-label="Status studia produkcyjnego">
      <div className="studio-transport__identity">
        <div className="studio-transport__mark"><AudioWaveform size={19} /></div>
        <div>
          <span className="studio-eyebrow">CC AUDIO ENGINE</span>
          <strong>{project.title}</strong>
        </div>
      </div>

      <div className="studio-transport__display" aria-live="polite">
        <span className={isSynthesizing || isRenderingMaster || isRenderingVideo ? 'is-busy' : ''}>
          <CircleDot size={12} /> {busyLabel}
        </span>
        <b>0{currentStep}:00:00</b>
        <small>KROK {currentStep}/8</small>
      </div>

      <div className="studio-meter" aria-label="Miernik aktywności">
        {Array.from({ length: 18 }).map((_, index) => (
          <i key={index} style={{ height: `${18 + ((index * 17) % 54)}%` }} />
        ))}
      </div>

      <div className="studio-transport__stats">
        <span><Radio size={13} /> 48 kHz / 24-bit</span>
        <span><Activity size={13} /> {clips}/{lines} klipów</span>
        <span><Film size={13} /> {project.renderedVideoMp4Url ? 'MP4 gotowy' : 'MP4 oczekuje'}</span>
        <span><ShieldCheck size={13} /> Strażnik Słowa</span>
        <span><Gauge size={13} /> −16 LUFS</span>
      </div>
    </section>
  );
};
