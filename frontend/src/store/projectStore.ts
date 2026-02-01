'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  VideoProjectState,
  Voice,
  VoiceSettings,
  AspectRatio,
  Resolution,
  BackgroundConfig,
  SubtitleStyle,
  GenerationProgress,
  initialProjectState,
  defaultVoiceSettings,
  defaultSubtitleStyle,
  defaultBackground,
} from '@/types/project';
import { AvatarSelection } from '@/components/AvatarSelector';

interface ProjectStore extends VideoProjectState {
  // Step navigation
  currentStep: number;
  setCurrentStep: (step: number) => void;
  canProceedToStep: (step: number) => boolean;

  // Avatar actions
  setAvatar: (avatar: AvatarSelection | null) => void;

  // Script actions
  setScriptText: (text: string) => void;
  setScriptVariable: (key: string, value: string) => void;
  clearScript: () => void;

  // Voice actions
  setVoice: (voice: Voice | null) => void;
  setVoiceSettings: (settings: Partial<VoiceSettings>) => void;

  // Video settings actions
  setAspectRatio: (ratio: AspectRatio) => void;
  setResolution: (resolution: Resolution) => void;
  setBackground: (background: BackgroundConfig) => void;
  setSubtitlesEnabled: (enabled: boolean) => void;
  setSubtitleStyle: (style: Partial<SubtitleStyle>) => void;
  setSubtitleLanguage: (language: string) => void;

  // Generation actions
  setGenerationProgress: (progress: Partial<GenerationProgress>) => void;
  startGeneration: (jobId: string) => void;
  cancelGeneration: () => void;
  resetGeneration: () => void;

  // Project actions
  resetProject: () => void;
  saveProject: () => void;
  loadProject: (projectId: string) => void;
  markDirty: () => void;
  markClean: () => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      ...initialProjectState,
      currentStep: 1,

      // Step navigation
      setCurrentStep: (step) => set({ currentStep: step }),

      canProceedToStep: (step) => {
        const state = get();
        switch (step) {
          case 1:
            return true;
          case 2:
            return state.avatar !== null;
          case 3:
            return state.avatar !== null && state.script.text.length >= 10;
          case 4:
            return (
              state.avatar !== null &&
              state.script.text.length >= 10 &&
              state.voice.selected !== null
            );
          default:
            return false;
        }
      },

      // Avatar actions
      setAvatar: (avatar) =>
        set({
          avatar,
          isDirty: true,
        }),

      // Script actions
      setScriptText: (text) =>
        set((state) => ({
          script: { ...state.script, text },
          isDirty: true,
        })),

      setScriptVariable: (key, value) =>
        set((state) => ({
          script: {
            ...state.script,
            variables: { ...state.script.variables, [key]: value },
          },
          isDirty: true,
        })),

      clearScript: () =>
        set((state) => ({
          script: { text: '', variables: {} },
          isDirty: true,
        })),

      // Voice actions
      setVoice: (voice) =>
        set((state) => ({
          voice: { ...state.voice, selected: voice },
          isDirty: true,
        })),

      setVoiceSettings: (settings) =>
        set((state) => ({
          voice: {
            ...state.voice,
            settings: { ...state.voice.settings, ...settings },
          },
          isDirty: true,
        })),

      // Video settings actions
      setAspectRatio: (aspectRatio) =>
        set((state) => ({
          video: { ...state.video, aspectRatio },
          isDirty: true,
        })),

      setResolution: (resolution) =>
        set((state) => ({
          video: { ...state.video, resolution },
          isDirty: true,
        })),

      setBackground: (background) =>
        set((state) => ({
          video: { ...state.video, background },
          isDirty: true,
        })),

      setSubtitlesEnabled: (enabled) =>
        set((state) => ({
          video: {
            ...state.video,
            subtitles: { ...state.video.subtitles, enabled },
          },
          isDirty: true,
        })),

      setSubtitleStyle: (style) =>
        set((state) => ({
          video: {
            ...state.video,
            subtitles: {
              ...state.video.subtitles,
              style: { ...state.video.subtitles.style, ...style },
            },
          },
          isDirty: true,
        })),

      setSubtitleLanguage: (language) =>
        set((state) => ({
          video: {
            ...state.video,
            subtitles: { ...state.video.subtitles, language },
          },
          isDirty: true,
        })),

      // Generation actions
      setGenerationProgress: (progress) =>
        set((state) => ({
          generation: { ...state.generation, ...progress },
        })),

      startGeneration: (jobId) =>
        set({
          generation: {
            status: 'processing',
            progress: 0,
            stage: 'queued',
            message: 'Starting video generation...',
            jobId,
          },
        }),

      cancelGeneration: () =>
        set((state) => ({
          generation: {
            ...state.generation,
            status: 'cancelled',
            message: 'Generation cancelled',
          },
        })),

      resetGeneration: () =>
        set({
          generation: {
            status: 'idle',
            progress: 0,
            stage: 'queued',
            message: '',
          },
        }),

      // Project actions
      resetProject: () =>
        set({
          ...initialProjectState,
          currentStep: 1,
        }),

      saveProject: () => {
        const state = get();
        set({
          lastSaved: new Date(),
          isDirty: false,
        });
        // In production, this would also save to the backend
        console.log('Project saved:', state.projectId);
      },

      loadProject: (projectId) => {
        // In production, this would load from the backend
        set({ projectId });
      },

      markDirty: () => set({ isDirty: true }),
      markClean: () => set({ isDirty: false }),
    }),
    {
      name: 'ugc-project-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        avatar: state.avatar,
        script: state.script,
        voice: {
          selected: state.voice.selected,
          settings: state.voice.settings,
        },
        video: state.video,
        // Don't persist step 5 (generation) - always return to step 4 max
        currentStep: state.currentStep >= 5 ? 4 : state.currentStep,
        projectId: state.projectId,
      }),
    }
  )
);
