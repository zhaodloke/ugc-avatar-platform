'use client';

import React, { useState, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import {
  AspectRatio,
  Resolution,
  BackgroundConfig,
  SubtitleStyle,
} from '@/types/project';

interface VideoSettingsProps {
  aspectRatio: AspectRatio;
  resolution: Resolution;
  background: BackgroundConfig;
  subtitlesEnabled: boolean;
  subtitleStyle: SubtitleStyle;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onResolutionChange: (resolution: Resolution) => void;
  onBackgroundChange: (background: BackgroundConfig) => void;
  onSubtitlesEnabledChange: (enabled: boolean) => void;
  onSubtitleStyleChange: (style: Partial<SubtitleStyle>) => void;
  onGenerate: () => void;
  onBack: () => void;
  disabled?: boolean;
  className?: string;
}

const aspectRatioOptions: { value: AspectRatio; label: string; description: string; icon: string }[] = [
  { value: '16:9', label: 'Landscape', description: 'YouTube, LinkedIn', icon: '📺' },
  { value: '9:16', label: 'Portrait', description: 'TikTok, Reels', icon: '📱' },
  { value: '1:1', label: 'Square', description: 'Instagram Feed', icon: '⬜' },
  { value: '4:5', label: 'Vertical', description: 'Instagram Feed', icon: '📋' },
];

const resolutionOptions: { value: Resolution; label: string }[] = [
  { value: '720p', label: '720p (HD)' },
  { value: '1080p', label: '1080p (Full HD)' },
  { value: '4k', label: '4K (Ultra HD)' },
];

const backgroundColors = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483',
  '#e94560', '#ff6b6b', '#ffd93d', '#6bcb77',
  '#4d96ff', '#ffffff', '#f0f0f0', '#000000',
];

const gradientPresets = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

const fontOptions = ['Inter', 'Arial', 'Roboto', 'Open Sans', 'Montserrat'];
const fontSizeOptions: SubtitleStyle['fontSize'][] = ['small', 'medium', 'large'];
const positionOptions: SubtitleStyle['position'][] = ['top', 'middle', 'bottom'];

export function VideoSettings({
  aspectRatio,
  resolution,
  background,
  subtitlesEnabled,
  subtitleStyle,
  onAspectRatioChange,
  onResolutionChange,
  onBackgroundChange,
  onSubtitlesEnabledChange,
  onSubtitleStyleChange,
  onGenerate,
  onBack,
  disabled = false,
  className,
}: VideoSettingsProps) {
  const [backgroundTab, setBackgroundTab] = useState<'color' | 'gradient' | 'image'>(
    background.type === 'gradient' ? 'gradient' : background.type === 'image' ? 'image' : 'color'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleColorSelect = useCallback(
    (color: string) => {
      onBackgroundChange({ type: 'color', value: color });
    },
    [onBackgroundChange]
  );

  const handleGradientSelect = useCallback(
    (gradient: string) => {
      onBackgroundChange({ type: 'gradient', value: gradient });
    },
    [onBackgroundChange]
  );

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            onBackgroundChange({
              type: 'image',
              value: event.target.result as string,
              imageFile: file,
            });
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [onBackgroundChange]
  );

  const getAspectRatioStyle = (ratio: AspectRatio) => {
    switch (ratio) {
      case '16:9':
        return { width: '64px', height: '36px' };
      case '9:16':
        return { width: '36px', height: '64px' };
      case '1:1':
        return { width: '48px', height: '48px' };
      case '4:5':
        return { width: '40px', height: '50px' };
      default:
        return { width: '48px', height: '48px' };
    }
  };

  return (
    <div className={clsx('w-full max-w-4xl mx-auto', className)}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Video Settings</h2>
        <p className="text-gray-600">
          Customize your video format, background, and subtitles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Aspect Ratio */}
          <div className="p-5 bg-white rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Aspect Ratio</h3>
            <div className="grid grid-cols-2 gap-3">
              {aspectRatioOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onAspectRatioChange(option.value)}
                  className={clsx(
                    'p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2',
                    aspectRatio === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div
                    className={clsx(
                      'rounded border-2 flex items-center justify-center text-lg',
                      aspectRatio === option.value
                        ? 'border-primary-400 bg-primary-100'
                        : 'border-gray-300 bg-gray-100'
                    )}
                    style={getAspectRatioStyle(option.value)}
                  >
                    {option.icon}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div className="p-5 bg-white rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Resolution</h3>
            <div className="flex gap-2">
              {resolutionOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onResolutionChange(option.value)}
                  className={clsx(
                    'flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border-2 transition-all',
                    resolution === option.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background */}
          <div className="p-5 bg-white rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Background</h3>

            {/* Background Type Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4">
              {(['color', 'gradient', 'image'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setBackgroundTab(tab)}
                  className={clsx(
                    'flex-1 py-2 text-sm font-medium rounded-md capitalize transition-colors',
                    backgroundTab === tab
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Color Options */}
            {backgroundTab === 'color' && (
              <div className="grid grid-cols-6 gap-2">
                {backgroundColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={clsx(
                      'w-full aspect-square rounded-lg border-2 transition-all',
                      background.type === 'color' && background.value === color
                        ? 'border-primary-500 scale-110'
                        : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                {/* Custom Color Input */}
                <div className="relative">
                  <input
                    type="color"
                    value={background.type === 'color' ? background.value : '#1a1a2e'}
                    onChange={(e) => handleColorSelect(e.target.value)}
                    className="w-full aspect-square rounded-lg cursor-pointer opacity-0 absolute inset-0"
                  />
                  <div className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                    +
                  </div>
                </div>
              </div>
            )}

            {/* Gradient Options */}
            {backgroundTab === 'gradient' && (
              <div className="grid grid-cols-3 gap-2">
                {gradientPresets.map((gradient) => (
                  <button
                    key={gradient}
                    onClick={() => handleGradientSelect(gradient)}
                    className={clsx(
                      'h-16 rounded-lg border-2 transition-all',
                      background.type === 'gradient' && background.value === gradient
                        ? 'border-primary-500 scale-105'
                        : 'border-transparent hover:scale-102'
                    )}
                    style={{ background: gradient }}
                  />
                ))}
              </div>
            )}

            {/* Image Upload */}
            {backgroundTab === 'image' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {background.type === 'image' && background.value ? (
                  <div className="relative">
                    <img
                      src={background.value}
                      alt="Background preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-medium rounded-lg opacity-0 hover:opacity-100 transition-opacity"
                    >
                      Change Image
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-gray-400 transition-colors"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">Upload background image</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Subtitles */}
        <div className="space-y-6">
          <div className="p-5 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Subtitles</h3>
              <button
                onClick={() => onSubtitlesEnabledChange(!subtitlesEnabled)}
                className={clsx(
                  'relative w-11 h-6 rounded-full transition-colors',
                  subtitlesEnabled ? 'bg-primary-600' : 'bg-gray-200'
                )}
              >
                <span
                  className={clsx(
                    'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm',
                    subtitlesEnabled && 'translate-x-5'
                  )}
                />
              </button>
            </div>

            {subtitlesEnabled && (
              <div className="space-y-4">
                {/* Font Family */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Font
                  </label>
                  <select
                    value={subtitleStyle.fontFamily}
                    onChange={(e) => onSubtitleStyleChange({ fontFamily: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {fontOptions.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Size
                  </label>
                  <div className="flex gap-2">
                    {fontSizeOptions.map((size) => (
                      <button
                        key={size}
                        onClick={() => onSubtitleStyleChange({ fontSize: size })}
                        className={clsx(
                          'flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-colors',
                          subtitleStyle.fontSize === size
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={subtitleStyle.color}
                        onChange={(e) => onSubtitleStyleChange({ color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-500">{subtitleStyle.color}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Background
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={subtitleStyle.backgroundColor}
                        onChange={(e) => onSubtitleStyleChange({ backgroundColor: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer"
                        disabled={!subtitleStyle.showBackground}
                      />
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={subtitleStyle.showBackground}
                          onChange={(e) =>
                            onSubtitleStyleChange({ showBackground: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-xs text-gray-500">Show</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Position
                  </label>
                  <div className="flex gap-2">
                    {positionOptions.map((position) => (
                      <button
                        key={position}
                        onClick={() => onSubtitleStyleChange({ position })}
                        className={clsx(
                          'flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-colors',
                          subtitleStyle.position === position
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {position}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Card */}
          <div className="p-5 bg-white rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Preview</h3>
            <div
              className="relative rounded-lg overflow-hidden flex items-center justify-center mx-auto"
              style={{
                ...getAspectRatioStyle(aspectRatio),
                width: '100%',
                height: 'auto',
                aspectRatio: aspectRatio.replace(':', '/'),
                maxHeight: '200px',
                background:
                  background.type === 'gradient'
                    ? background.value
                    : background.type === 'image'
                    ? `url(${background.value}) center/cover`
                    : background.value,
              }}
            >
              {/* Avatar placeholder */}
              <div className="w-16 h-16 rounded-full bg-gray-300/50 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>

              {/* Subtitle preview */}
              {subtitlesEnabled && (
                <div
                  className={clsx(
                    'absolute left-2 right-2 text-center',
                    subtitleStyle.position === 'top' && 'top-2',
                    subtitleStyle.position === 'middle' && 'top-1/2 -translate-y-1/2',
                    subtitleStyle.position === 'bottom' && 'bottom-2'
                  )}
                >
                  <span
                    className={clsx(
                      'inline-block px-2 py-1 rounded',
                      subtitleStyle.fontSize === 'small' && 'text-[8px]',
                      subtitleStyle.fontSize === 'medium' && 'text-[10px]',
                      subtitleStyle.fontSize === 'large' && 'text-xs'
                    )}
                    style={{
                      fontFamily: subtitleStyle.fontFamily,
                      color: subtitleStyle.color,
                      backgroundColor: subtitleStyle.showBackground
                        ? subtitleStyle.backgroundColor + 'cc'
                        : 'transparent',
                    }}
                  >
                    Sample subtitle text
                  </span>
                </div>
              )}
            </div>
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
          onClick={onGenerate}
          disabled={disabled}
          className={clsx(
            'inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold rounded-lg transition-all',
            !disabled
              ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/25'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Generate Video
        </button>
      </div>
    </div>
  );
}

export default VideoSettings;
