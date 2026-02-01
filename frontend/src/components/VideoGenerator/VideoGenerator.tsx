'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { GenerationProgress, GenerationStatus } from '@/types/project';

interface VideoGeneratorProps {
  progress: GenerationProgress;
  onCancel: () => void;
  onDownload: () => void;
  onCreateAnother: () => void;
  onEditAndRegenerate: () => void;
  className?: string;
}

const stageLabels: Record<GenerationProgress['stage'], string> = {
  queued: 'Queued',
  processing_script: 'Processing Script',
  generating_speech: 'Generating Speech',
  rendering_video: 'Rendering Video',
  finalizing: 'Finalizing',
  done: 'Complete',
};

const stageDescriptions: Record<GenerationProgress['stage'], string> = {
  queued: 'Your video is in the queue...',
  processing_script: 'Analyzing your script and preparing the avatar...',
  generating_speech: 'Converting text to natural speech...',
  rendering_video: 'Creating your talking head video...',
  finalizing: 'Adding finishing touches...',
  done: 'Your video is ready!',
};

export function VideoGenerator({
  progress,
  onCancel,
  onDownload,
  onCreateAnother,
  onEditAndRegenerate,
  className,
}: VideoGeneratorProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Track elapsed time
  useEffect(() => {
    if (progress.status === 'processing') {
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (progress.status === 'idle') {
      setElapsedTime(0);
    }
  }, [progress.status]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: GenerationStatus) => {
    switch (status) {
      case 'processing':
        return 'text-primary-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'cancelled':
        return 'text-amber-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressBarColor = (status: GenerationStatus) => {
    switch (status) {
      case 'processing':
        return 'bg-primary-600';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-amber-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className={clsx('w-full max-w-2xl mx-auto', className)}>
      {/* Processing State */}
      {progress.status === 'processing' && (
        <div className="text-center">
          {/* Animated Icon */}
          <div className="mb-6">
            <div className="relative w-24 h-24 mx-auto">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
              {/* Spinning ring */}
              <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
              {/* Inner icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Status Text */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Generating Your Video
          </h2>
          <p className="text-gray-600 mb-6">
            {stageDescriptions[progress.stage]}
          </p>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>{stageLabels[progress.stage]}</span>
              <span>{progress.progress}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-500',
                  getProgressBarColor(progress.status)
                )}
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>

          {/* Time Elapsed */}
          <p className="text-sm text-gray-500 mb-6">
            Time elapsed: {formatTime(elapsedTime)}
          </p>

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Cancel Generation
          </button>
        </div>
      )}

      {/* Completed State */}
      {progress.status === 'completed' && progress.videoUrl && (
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Video Generated Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Your talking head video is ready to download and share.
          </p>

          {/* Video Preview */}
          <div className="mb-6 rounded-xl overflow-hidden bg-black max-w-md mx-auto">
            <video
              src={progress.videoUrl}
              controls
              className="w-full"
              poster="/video-poster.jpg"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onDownload}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download MP4
            </button>

            <button
              onClick={onEditAndRegenerate}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit & Regenerate
            </button>

            <button
              onClick={onCreateAnother}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Another
            </button>
          </div>
        </div>
      )}

      {/* Failed State */}
      {progress.status === 'failed' && (
        <div className="text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Generation Failed
          </h2>
          <p className="text-gray-600 mb-2">
            We encountered an error while generating your video.
          </p>
          {progress.error && (
            <p className="text-sm text-red-600 mb-6 p-3 bg-red-50 rounded-lg">
              {progress.error}
            </p>
          )}

          {/* Retry Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onEditAndRegenerate}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </button>

            <button
              onClick={onCreateAnother}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Cancelled State */}
      {progress.status === 'cancelled' && (
        <div className="text-center">
          {/* Cancelled Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Generation Cancelled
          </h2>
          <p className="text-gray-600 mb-6">
            The video generation was cancelled. Your progress has been saved.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onEditAndRegenerate}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Resume Generation
            </button>

            <button
              onClick={onCreateAnother}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoGenerator;
