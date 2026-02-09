'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { WizardLayout } from '@/components/WizardLayout';
import { AvatarSelector, AvatarSelection } from '@/components/AvatarSelector';
import { ScriptInput } from '@/components/ScriptInput';
import { VoiceSelector } from '@/components/VoiceSelector';
import { VideoSettings } from '@/components/VideoSettings';
import { VideoGenerator } from '@/components/VideoGenerator';
import { apiService, pollGenerationStatus, downloadVideo, checkBackendHealth } from '@/services/api';
import { Voice, VoiceSettings } from '@/types/project';

const wizardSteps = [
  { id: 1, name: 'Avatar', description: 'Choose your avatar' },
  { id: 2, name: 'Script', description: 'Write your script' },
  { id: 3, name: 'Voice', description: 'Select voice' },
  { id: 4, name: 'Settings', description: 'Customize video' },
];

export default function Home() {
  const store = useProjectStore();
  const [mounted, setMounted] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const pollingRef = useRef<boolean>(false);

  // Handle hydration and check backend health
  useEffect(() => {
    setMounted(true);

    // Reset generation state on mount (clear any stale failed/processing states)
    if (store.generation.status === 'failed' || store.generation.status === 'processing') {
      store.resetGeneration();
    }

    // Ensure currentStep is always valid (1-5)
    if (!store.currentStep || store.currentStep < 1 || store.currentStep > 5) {
      store.setCurrentStep(1);
    }
    // If currentStep is beyond what we have data for, reset to appropriate step
    else if (store.currentStep > 1 && !store.avatar) {
      store.setCurrentStep(1);
    }

    // Check if backend is running
    checkBackendHealth().then((isHealthy) => {
      setBackendStatus(isHealthy ? 'online' : 'offline');
    });
  }, []);

  // Handle avatar selection
  const handleAvatarSelect = useCallback(
    (selection: AvatarSelection | null) => {
      store.setAvatar(selection);
    },
    [store]
  );

  // Handle continue from avatar selection
  const handleAvatarContinue = useCallback(() => {
    if (store.avatar) {
      store.setCurrentStep(2);
    }
  }, [store]);

  // Handle script changes
  const handleScriptChange = useCallback(
    (text: string) => {
      store.setScriptText(text);
    },
    [store]
  );

  // Handle voice selection
  const handleVoiceSelect = useCallback(
    (voice: Voice) => {
      store.setVoice(voice);
    },
    [store]
  );

  // Handle voice settings changes
  const handleVoiceSettingsChange = useCallback(
    (settings: Partial<VoiceSettings>) => {
      store.setVoiceSettings(settings);
    },
    [store]
  );

  // Handle video generation - REAL API CALL
  const handleGenerate = useCallback(async () => {
    store.setCurrentStep(5); // Move to generation view

    // Check backend health first
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) {
      store.setGenerationProgress({
        status: 'failed',
        error: 'Backend server is not running. Please start the backend with: cd backend && uvicorn app.main:app --reload',
      });
      return;
    }

    try {
      // Get project state for API call
      const projectState = {
        avatar: store.avatar,
        script: store.script,
        voice: store.voice,
        video: store.video,
        generation: store.generation,
        isDirty: store.isDirty,
      };

      // Call the real API to generate video
      console.log('Submitting video generation request...');
      const videoResponse = await apiService.generateVideo(projectState);
      console.log('Video generation started:', videoResponse);

      // Start polling for status
      const videoId = videoResponse.id;
      store.startGeneration(String(videoId));
      pollingRef.current = true;

      // Poll for status updates
      await pollGenerationStatus(
        videoId,
        (progress) => {
          if (!pollingRef.current) return;

          console.log('Generation progress:', progress);
          store.setGenerationProgress({
            status: progress.status,
            progress: progress.progress,
            stage: progress.stage,
            message: progress.message,
            videoUrl: progress.videoUrl,
            error: progress.error,
          });
        },
        3000 // Poll every 3 seconds
      );
    } catch (error) {
      console.error('Generation failed:', error);
      store.setGenerationProgress({
        status: 'failed',
        error: error instanceof Error ? error.message : 'An unexpected error occurred. Make sure the backend is running.',
      });
    }
  }, [store]);

  // Handle generation cancel
  const handleCancel = useCallback(() => {
    pollingRef.current = false;
    store.cancelGeneration();
  }, [store]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (store.generation.videoUrl) {
      downloadVideo(store.generation.videoUrl, 'ugc-avatar-video.mp4');
    }
  }, [store.generation.videoUrl]);

  // Handle create another
  const handleCreateAnother = useCallback(() => {
    pollingRef.current = false;
    store.resetProject();
  }, [store]);

  // Handle edit and regenerate
  const handleEditAndRegenerate = useCallback(() => {
    pollingRef.current = false;
    store.resetGeneration();
    store.setCurrentStep(4);
  }, [store]);

  // Compute effective step (handle hydration edge cases)
  // Keep step 5 if generation failed (to show error), only reset if idle on page load
  const effectiveStep = (() => {
    if (!store.currentStep || store.currentStep < 1 || store.currentStep > 5) {
      return 1;
    }
    // If step is 5 but generation is idle (not started), go back to step 1
    // Keep step 5 for failed/cancelled so user sees the error
    if (store.currentStep === 5 && store.generation.status === 'idle') {
      return 1;
    }
    // If step > 1 but no avatar selected, go back to step 1
    if (store.currentStep > 1 && !store.avatar) {
      return 1;
    }
    return store.currentStep;
  })();

  // Don't render until mounted (avoid hydration mismatch)
  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              UGC Avatar Platform
            </h1>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            UGC Avatar Platform
          </h1>
          <p className="text-gray-600">
            Create AI-powered talking head videos with HunyuanVideo
          </p>

          {/* Backend Status Indicator */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-green-500'
                  : backendStatus === 'offline'
                  ? 'bg-red-500'
                  : 'bg-yellow-500 animate-pulse'
              }`}
            />
            <span className="text-xs text-gray-500">
              {backendStatus === 'online'
                ? 'Backend Connected'
                : backendStatus === 'offline'
                ? 'Backend Offline'
                : 'Checking...'}
            </span>
          </div>
        </div>

        {/* Backend Offline Warning */}
        {backendStatus === 'offline' && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
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
              <div>
                <h3 className="text-sm font-medium text-amber-800">
                  Backend Server Not Running
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  To generate videos, start the backend server:
                </p>
                <pre className="mt-2 p-2 bg-amber-100 rounded text-xs text-amber-900 overflow-x-auto">
                  cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
                </pre>
                <p className="text-xs text-amber-600 mt-2">
                  Also ensure PostgreSQL, Redis, and the Celery worker are running.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wizard */}
        {effectiveStep >= 1 && effectiveStep <= 4 && (
          <WizardLayout steps={wizardSteps} currentStep={effectiveStep}>
            {/* Step 1: Avatar Selection */}
            {effectiveStep === 1 && (
              <div className="flex flex-col items-center">
                <AvatarSelector
                  onAvatarSelect={handleAvatarSelect}
                  defaultMode="library"
                />

                {/* Continue Button */}
                {store.avatar && (
                  <button
                    onClick={handleAvatarContinue}
                    className="mt-6 inline-flex items-center gap-2 px-8 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/25"
                  >
                    Continue with Selected Avatar
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Step 2: Script Input */}
            {effectiveStep === 2 && (
              <ScriptInput
                value={store.script.text}
                onChange={handleScriptChange}
                onContinue={() => store.setCurrentStep(3)}
                onBack={() => store.setCurrentStep(1)}
              />
            )}

            {/* Step 3: Voice Selection */}
            {effectiveStep === 3 && (
              <VoiceSelector
                selectedVoice={store.voice.selected}
                voiceSettings={store.voice.settings}
                onVoiceSelect={handleVoiceSelect}
                onSettingsChange={handleVoiceSettingsChange}
                onContinue={() => store.setCurrentStep(4)}
                onBack={() => store.setCurrentStep(2)}
              />
            )}

            {/* Step 4: Video Settings */}
            {effectiveStep === 4 && (
              <VideoSettings
                aspectRatio={store.video.aspectRatio}
                resolution={store.video.resolution}
                background={store.video.background}
                subtitlesEnabled={store.video.subtitles.enabled}
                subtitleStyle={store.video.subtitles.style}
                onAspectRatioChange={store.setAspectRatio}
                onResolutionChange={store.setResolution}
                onBackgroundChange={store.setBackground}
                onSubtitlesEnabledChange={store.setSubtitlesEnabled}
                onSubtitleStyleChange={store.setSubtitleStyle}
                onGenerate={handleGenerate}
                onBack={() => store.setCurrentStep(3)}
                disabled={backendStatus === 'offline'}
              />
            )}
          </WizardLayout>
        )}

        {/* Step 5: Generation */}
        {effectiveStep === 5 && (
          <div className="py-12">
            <VideoGenerator
              progress={store.generation}
              onCancel={handleCancel}
              onDownload={handleDownload}
              onCreateAnother={handleCreateAnother}
              onEditAndRegenerate={handleEditAndRegenerate}
            />
          </div>
        )}

        {/* Project Summary (visible during steps 2-4) */}
        {effectiveStep >= 2 && effectiveStep <= 4 && store.avatar && (
          <div className="mt-8 p-4 bg-white rounded-xl border border-gray-200 shadow-sm max-w-3xl mx-auto">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Project Summary</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              {/* Avatar */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Avatar:</span>
                <span className="font-medium text-gray-900">
                  {store.avatar.type === 'library'
                    ? store.avatar.data.name
                    : store.avatar.data.fileName}
                </span>
              </div>

              {/* Script */}
              {store.script.text && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Script:</span>
                  <span className="font-medium text-gray-900">
                    {store.script.text.split(/\s+/).length} words
                  </span>
                </div>
              )}

              {/* Voice */}
              {store.voice.selected && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Voice:</span>
                  <span className="font-medium text-gray-900">
                    {store.voice.selected.name}
                  </span>
                </div>
              )}

              {/* Format */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Format:</span>
                <span className="font-medium text-gray-900">
                  {store.video.aspectRatio} • {store.video.resolution}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
