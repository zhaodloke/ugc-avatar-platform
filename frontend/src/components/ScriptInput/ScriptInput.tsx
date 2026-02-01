'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { scriptTemplates, getTemplateCategories } from './templates';
import { ScriptTemplate } from '@/types/project';

interface ScriptInputProps {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  maxLength?: number;
  minLength?: number;
  disabled?: boolean;
  className?: string;
}

// Estimate ~150 words per minute for speech
const WORDS_PER_MINUTE = 150;

export function ScriptInput({
  value,
  onChange,
  onContinue,
  onBack,
  maxLength = 5000,
  minLength = 10,
  disabled = false,
  className,
}: ScriptInputProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate stats
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const estimatedDuration = Math.ceil(wordCount / WORDS_PER_MINUTE * 60); // in seconds

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const isValid = charCount >= minLength && charCount <= maxLength;
  const categories = ['all', ...getTemplateCategories()];

  const filteredTemplates =
    selectedCategory === 'all'
      ? scriptTemplates
      : scriptTemplates.filter((t) => t.category === selectedCategory);

  const handleTemplateSelect = useCallback(
    (template: ScriptTemplate) => {
      onChange(template.content);
      setShowTemplates(false);
      textareaRef.current?.focus();
    },
    [onChange]
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (newValue.length <= maxLength) {
        onChange(newValue);
      }
    },
    [onChange, maxLength]
  );

  const handleClear = useCallback(() => {
    onChange('');
    textareaRef.current?.focus();
  }, [onChange]);

  // Extract variables from script
  const variables = value.match(/\{\{(\w+)\}\}/g) || [];
  const uniqueVariables = [...new Set(variables.map((v) => v.slice(2, -2)))];

  return (
    <div className={clsx('w-full max-w-3xl mx-auto', className)}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Write Your Script</h2>
        <p className="text-gray-600">
          Enter the text you want your avatar to speak. Use templates for inspiration.
        </p>
      </div>

      {/* Template Selector */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className={clsx(
            'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            showTemplates
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          {showTemplates ? 'Hide Templates' : 'Use a Template'}
        </button>
      </div>

      {/* Templates Dropdown */}
      {showTemplates && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in fade-in duration-200">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={clsx(
                  'px-3 py-1 text-xs font-medium rounded-full capitalize transition-colors',
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">{template.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {template.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Editor */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{charCount.toLocaleString()} / {maxLength.toLocaleString()} chars</span>
            <span>{wordCount.toLocaleString()} words</span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              ~{formatDuration(estimatedDuration)}
            </span>
          </div>
          {value.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          disabled={disabled}
          placeholder="Enter the script you want your avatar to speak...

Example: Hey everyone! Today I want to share something exciting with you..."
          className={clsx(
            'w-full min-h-[300px] p-4 text-gray-900 placeholder-gray-400 resize-y',
            'focus:outline-none focus:ring-0 border-0',
            'disabled:bg-gray-50 disabled:text-gray-500'
          )}
          style={{ lineHeight: '1.7' }}
        />

        {/* Character limit warning */}
        {charCount > maxLength * 0.9 && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
            <p className="text-xs text-amber-700">
              {charCount >= maxLength
                ? 'Character limit reached'
                : `Approaching character limit (${maxLength - charCount} remaining)`}
            </p>
          </div>
        )}
      </div>

      {/* Variables Preview */}
      {uniqueVariables.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Variables Detected ({uniqueVariables.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {uniqueVariables.map((variable) => (
              <span
                key={variable}
                className="inline-flex items-center px-2 py-1 text-xs font-mono bg-blue-100 text-blue-700 rounded"
              >
                {`{{${variable}}}`}
              </span>
            ))}
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Replace these with actual values before generating your video.
          </p>
        </div>
      )}

      {/* Validation Message */}
      {charCount > 0 && charCount < minLength && (
        <p className="mt-2 text-sm text-amber-600">
          Script is too short. Minimum {minLength} characters required ({minLength - charCount} more needed).
        </p>
      )}

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

export default ScriptInput;
