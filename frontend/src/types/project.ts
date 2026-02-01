/**
 * Type definitions for the video project state
 */

import { AvatarSelection } from '@/components/AvatarSelector';

/** Voice characteristics */
export interface Voice {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  accent: string;
  ageRange: 'young' | 'middle-aged' | 'senior';
  tone: 'professional' | 'casual' | 'energetic' | 'calm';
  previewUrl?: string;
}

/** Voice settings */
export interface VoiceSettings {
  speed: number; // 0.5 to 2.0
  pitch: number; // 0.5 to 2.0
  pauseDuration: number; // seconds between sentences
}

/** Subtitle style configuration */
export interface SubtitleStyle {
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  color: string;
  backgroundColor: string;
  showBackground: boolean;
  position: 'top' | 'middle' | 'bottom';
}

/** Video aspect ratio options */
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

/** Video resolution options */
export type Resolution = '720p' | '1080p' | '4k';

/** Background configuration */
export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'image' | 'greenscreen' | 'ai';
  value: string; // hex color, gradient string, image URL, or AI prompt
  imageFile?: File;
}

/** Script template */
export interface ScriptTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  description: string;
}

/** Generation status */
export type GenerationStatus = 'idle' | 'processing' | 'completed' | 'failed' | 'cancelled';

/** Generation progress stages */
export interface GenerationProgress {
  status: GenerationStatus;
  progress: number; // 0-100
  stage: 'queued' | 'processing_script' | 'generating_speech' | 'rendering_video' | 'finalizing' | 'done';
  message: string;
  videoUrl?: string;
  error?: string;
  jobId?: string;
}

/** Complete video project state */
export interface VideoProjectState {
  // Step 1: Avatar
  avatar: AvatarSelection | null;

  // Step 2: Script
  script: {
    text: string;
    variables: Record<string, string>;
  };

  // Step 3: Voice
  voice: {
    selected: Voice | null;
    settings: VoiceSettings;
  };

  // Step 4: Video Settings
  video: {
    aspectRatio: AspectRatio;
    resolution: Resolution;
    background: BackgroundConfig;
    subtitles: {
      enabled: boolean;
      style: SubtitleStyle;
      language: string;
    };
  };

  // Generation
  generation: GenerationProgress;

  // Meta
  projectId?: string;
  lastSaved?: Date;
  isDirty: boolean;
}

/** Wizard step definition */
export interface WizardStep {
  id: number;
  name: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}

/** Default subtitle style */
export const defaultSubtitleStyle: SubtitleStyle = {
  fontFamily: 'Inter',
  fontSize: 'medium',
  color: '#ffffff',
  backgroundColor: '#000000',
  showBackground: true,
  position: 'bottom',
};

/** Default voice settings */
export const defaultVoiceSettings: VoiceSettings = {
  speed: 1.0,
  pitch: 1.0,
  pauseDuration: 0.5,
};

/** Default background config */
export const defaultBackground: BackgroundConfig = {
  type: 'color',
  value: '#1a1a2e',
};

/** Initial project state */
export const initialProjectState: VideoProjectState = {
  avatar: null,
  script: {
    text: '',
    variables: {},
  },
  voice: {
    selected: null,
    settings: defaultVoiceSettings,
  },
  video: {
    aspectRatio: '9:16',
    resolution: '1080p',
    background: defaultBackground,
    subtitles: {
      enabled: true,
      style: defaultSubtitleStyle,
      language: 'en',
    },
  },
  generation: {
    status: 'idle',
    progress: 0,
    stage: 'queued',
    message: '',
  },
  isDirty: false,
};
