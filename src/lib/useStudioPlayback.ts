import { useState, useEffect } from 'react';
import { studioPlaybackEngine, StudioPlaybackState } from './studioPlaybackEngine';
import { ProductionProject } from '../types';

export function useStudioPlayback(project?: ProductionProject) {
  const [state, setState] = useState<StudioPlaybackState>(() => studioPlaybackEngine.getState());

  useEffect(() => {
    if (project) {
      studioPlaybackEngine.setProject(project);
    }
  }, [project]);

  useEffect(() => {
    const unsubscribe = studioPlaybackEngine.subscribe(() => {
      setState(studioPlaybackEngine.getState());
    });
    return unsubscribe;
  }, []);

  return {
    ...state,
    play: () => studioPlaybackEngine.play(),
    pause: () => studioPlaybackEngine.pause(),
    resume: () => studioPlaybackEngine.resume(),
    stop: () => studioPlaybackEngine.stop(),
    togglePlay: () => {
      if (state.isPlaying && !state.isPaused) {
        studioPlaybackEngine.pause();
      } else {
        studioPlaybackEngine.play();
      }
    },
    seekToLine: (index: number) => studioPlaybackEngine.seekToLine(index),
    next: () => studioPlaybackEngine.next(),
    prev: () => studioPlaybackEngine.prev(),
    setStemMode: (mode: any) => studioPlaybackEngine.setStemMode(mode),
    setMasterVolume: (vol: number) => studioPlaybackEngine.setMasterVolume(vol),
    setTrackVolume: (track: 'voice' | 'music' | 'sfx', vol: number) =>
      studioPlaybackEngine.setTrackVolume(track, vol),
    setSpeechRate: (rate: number) => studioPlaybackEngine.setSpeechRate(rate),
    toggleMute: (track: 'voice' | 'music' | 'fx') => studioPlaybackEngine.toggleMute(track),
  };
}
