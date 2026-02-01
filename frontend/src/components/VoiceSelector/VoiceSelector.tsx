'use client';

import React, { useState, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import { Voice, VoiceSettings } from '@/types/project';
import { defaultVoices, getUniqueAccents, getUniqueTones } from './voices';

interface VoiceSelectorProps {
  selectedVoice: Voice | null;
  voiceSettings: VoiceSettings;
  onVoiceSelect: (voice: Voice) => void;
  onSettingsChange: (settings: Partial<VoiceSettings>) => void;
  onContinue: () => void;
  onBack: () => void;
  disabled?: boolean;
  className?: string;
}

type GenderFilter = 'all' | 'male' | 'female' | 'neutral';
type ToneFilter = 'all' | Voice['tone'];

export function VoiceSelector({
  selectedVoice,
  voiceSettings,
  onVoiceSelect,
  onSettingsChange,
  onContinue,
  onBack,
  disabled = false,
  className,
}: VoiceSelectorProps) {
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [toneFilter, setToneFilter] = useState<ToneFilter>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const accents = getUniqueAccents();
  const tones = getUniqueTones();

  const filteredVoices = defaultVoices.filter((voice) => {
    if (genderFilter !== 'all' && voice.gender !== genderFilter) return false;
    if (toneFilter !== 'all' && voice.tone !== toneFilter) return false;
    return true;
  });

  const handlePlayPreview = useCallback((voice: Voice) => {
    // In production, this would play the actual voice preview
    // For now, we'll just show a playing state
    if (playingVoiceId === voice.id) {
      setPlayingVoiceId(null);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      setPlayingVoiceId(voice.id);
      // Simulate audio playback ending
      setTimeout(() => setPlayingVoiceId(null), 2000);
    }
  }, [playingVoiceId]);

  const handleVoiceSelect = useCallback(
    (voice: Voice) => {
      if (!disabled) {
        onVoiceSelect(voice);
      }
    },
    [disabled, onVoiceSelect]
  );

  const isValid = selectedVoice !== null;

  return (
    <div className={clsx('w-full max-w-4xl mx-auto', className)}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a Voice</h2>
        <p className="text-gray-600">
          Select the voice for your avatar and customize speech settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Voice Selection */}
        <div className="lg:col-span-2">
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-4">
            {/* Gender Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Gender
              </label>
              <div className="flex gap-1">
                {(['all', 'male', 'female'] as GenderFilter[]).map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setGenderFilter(gender)}
                    className={clsx(
                      'px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors',
                      genderFilter === gender
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Tone
              </label>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setToneFilter('all')}
                  className={clsx(
                    'px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors',
                    toneFilter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  All
                </button>
                {tones.map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setToneFilter(tone)}
                    className={clsx(
                      'px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors',
                      toneFilter === tone
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Voice Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
            {filteredVoices.map((voice) => (
              <div
                key={voice.id}
                onClick={() => handleVoiceSelect(voice)}
                className={clsx(
                  'relative p-4 rounded-xl border-2 cursor-pointer transition-all',
                  selectedVoice?.id === voice.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{voice.name}</h4>
                      {selectedVoice?.id === voice.id && (
                        <span className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded capitalize">
                        {voice.gender}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {voice.accent}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded capitalize">
                        {voice.tone}
                      </span>
                    </div>
                  </div>

                  {/* Play Preview Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPreview(voice);
                    }}
                    className={clsx(
                      'p-2 rounded-full transition-colors',
                      playingVoiceId === voice.id
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                    title="Preview voice"
                  >
                    {playingVoiceId === voice.id ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredVoices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No voices match your filters. Try adjusting the filters.
            </div>
          )}
        </div>

        {/* Voice Settings Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Voice Settings</h3>

            {/* Speed Slider */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Speaking Speed
                </label>
                <span className="text-sm text-gray-500">{voiceSettings.speed}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={voiceSettings.speed}
                onChange={(e) =>
                  onSettingsChange({ speed: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.5x</span>
                <span>1x</span>
                <span>2x</span>
              </div>
            </div>

            {/* Pitch Slider */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Pitch
                </label>
                <span className="text-sm text-gray-500">{voiceSettings.pitch}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={voiceSettings.pitch}
                onChange={(e) =>
                  onSettingsChange({ pitch: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Low</span>
                <span>Normal</span>
                <span>High</span>
              </div>
            </div>

            {/* Pause Duration */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Pause Between Sentences
                </label>
                <span className="text-sm text-gray-500">{voiceSettings.pauseDuration}s</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={voiceSettings.pauseDuration}
                onChange={(e) =>
                  onSettingsChange({ pauseDuration: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>None</span>
                <span>1s</span>
                <span>2s</span>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={() =>
                onSettingsChange({
                  speed: 1.0,
                  pitch: 1.0,
                  pauseDuration: 0.5,
                })
              }
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Reset to defaults
            </button>

            {/* Selected Voice Preview */}
            {selectedVoice && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Selected Voice
                </h4>
                <div className="p-3 bg-primary-50 rounded-lg">
                  <p className="font-medium text-primary-900">{selectedVoice.name}</p>
                  <p className="text-xs text-primary-700 mt-0.5">
                    {selectedVoice.accent} • {selectedVoice.tone}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        <button
          onClick={onContinue}
          disabled={!isValid || disabled}
          className={clsx(
            'inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-colors',
            isValid && !disabled
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          )}
        >
          Continue
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default VoiceSelector;
