import { Voice } from '@/types/project';

/**
 * Default voice library
 * In production, these would be loaded from your TTS provider (e.g., ElevenLabs, OpenAI)
 */
export const defaultVoices: Voice[] = [
  {
    id: 'voice-1',
    name: 'Alex',
    gender: 'male',
    accent: 'American',
    ageRange: 'middle-aged',
    tone: 'professional',
    previewUrl: '/audio/voice-preview-alex.mp3',
  },
  {
    id: 'voice-2',
    name: 'Sarah',
    gender: 'female',
    accent: 'American',
    ageRange: 'young',
    tone: 'energetic',
    previewUrl: '/audio/voice-preview-sarah.mp3',
  },
  {
    id: 'voice-3',
    name: 'James',
    gender: 'male',
    accent: 'British',
    ageRange: 'middle-aged',
    tone: 'professional',
    previewUrl: '/audio/voice-preview-james.mp3',
  },
  {
    id: 'voice-4',
    name: 'Emma',
    gender: 'female',
    accent: 'British',
    ageRange: 'young',
    tone: 'casual',
    previewUrl: '/audio/voice-preview-emma.mp3',
  },
  {
    id: 'voice-5',
    name: 'Michael',
    gender: 'male',
    accent: 'American',
    ageRange: 'young',
    tone: 'casual',
    previewUrl: '/audio/voice-preview-michael.mp3',
  },
  {
    id: 'voice-6',
    name: 'Sophie',
    gender: 'female',
    accent: 'Australian',
    ageRange: 'middle-aged',
    tone: 'calm',
    previewUrl: '/audio/voice-preview-sophie.mp3',
  },
  {
    id: 'voice-7',
    name: 'David',
    gender: 'male',
    accent: 'American',
    ageRange: 'senior',
    tone: 'calm',
    previewUrl: '/audio/voice-preview-david.mp3',
  },
  {
    id: 'voice-8',
    name: 'Lisa',
    gender: 'female',
    accent: 'American',
    ageRange: 'middle-aged',
    tone: 'professional',
    previewUrl: '/audio/voice-preview-lisa.mp3',
  },
];

export function getVoiceById(id: string): Voice | undefined {
  return defaultVoices.find((v) => v.id === id);
}

export function getVoicesByGender(gender: Voice['gender']): Voice[] {
  return defaultVoices.filter((v) => v.gender === gender);
}

export function getVoicesByAccent(accent: string): Voice[] {
  return defaultVoices.filter((v) => v.accent === accent);
}

export function getVoicesByTone(tone: Voice['tone']): Voice[] {
  return defaultVoices.filter((v) => v.tone === tone);
}

export function getUniqueAccents(): string[] {
  return [...new Set(defaultVoices.map((v) => v.accent))];
}

export function getUniqueTones(): Voice['tone'][] {
  return [...new Set(defaultVoices.map((v) => v.tone))];
}
