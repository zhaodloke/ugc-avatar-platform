/**
 * API service for video generation - Connected to HunyuanVideo-1.5 backend
 */

import { VideoProjectState } from '@/types/project';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';


function absolutize(url?: string): string | undefined {
  if (!url) return url;
  const abs = /^https?:\/\//i;
  if (abs.test(url)) return url;
  const base = (API_BASE_URL || '').replace(/\/$/, '');
  const path = url.startsWith('/') ? url : '/' + url;
  return base + path;
}

/** Backend video status enum */
export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** Backend video response */
export interface VideoResponse {
  id: number;
  user_id: string;
  status: VideoStatus;
  reference_image_url: string;
  audio_url?: string;
  prompt: string;
  emotion?: string;
  style?: string;
  output_video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error_message?: string;
  processing_time_seconds?: number;
  created_at: string;
  updated_at: string;
}

/** Backend status response */
export interface VideoStatusResponse {
  id: number;
  status: VideoStatus;
  progress: number;
  message?: string;
  output_video_url?: string;
  error_message?: string;
}

/** Frontend generation progress (mapped from backend) */
export interface GenerationProgress {
  status: 'idle' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  stage: 'queued' | 'processing_script' | 'generating_speech' | 'rendering_video' | 'finalizing' | 'done';
  message: string;
  videoUrl?: string;
  error?: string;
  jobId?: string;
}

interface ApiError {
  message: string;
  detail?: string;
  code?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`,
      }));
      throw new Error(error.detail || error.message || 'An error occurred');
    }
    return response.json();
  }

  /**
   * Convert backend status to frontend progress format
   */
  private mapStatusToProgress(status: VideoStatusResponse): GenerationProgress {
    const backendStatus = status.status;

    let stage: GenerationProgress['stage'] = 'queued';
    let frontendStatus: GenerationProgress['status'] = 'processing';

    if (backendStatus === 'pending') {
      stage = 'queued';
      frontendStatus = 'processing';
    } else if (backendStatus === 'processing') {
      // Map progress to stages
      if (status.progress < 30) {
        stage = 'processing_script';
      } else if (status.progress < 50) {
        stage = 'generating_speech';
      } else if (status.progress < 90) {
        stage = 'rendering_video';
      } else {
        stage = 'finalizing';
      }
      frontendStatus = 'processing';
    } else if (backendStatus === 'completed') {
      stage = 'done';
      frontendStatus = 'completed';
    } else if (backendStatus === 'failed') {
      frontendStatus = 'failed';
    }

    return {
      status: frontendStatus,
      progress: status.progress,
      stage,
      message: status.message || this.getStageMessage(stage),
      videoUrl: absolutize(status.output_video_url),
      error: status.error_message,
      jobId: String(status.id),
    };
  }

  private getStageMessage(stage: GenerationProgress['stage']): string {
    const messages: Record<GenerationProgress['stage'], string> = {
      queued: 'Your video is in the queue...',
      processing_script: 'Processing your script...',
      generating_speech: 'Generating speech audio...',
      rendering_video: 'Rendering video with HunyuanVideo...',
      finalizing: 'Finalizing your video...',
      done: 'Video generation complete!',
    };
    return messages[stage];
  }

  /**
   * Generate a video from the project data
   * Matches backend POST /api/v1/videos/generate endpoint
   */
  async generateVideo(project: VideoProjectState): Promise<VideoResponse> {
    const formData = new FormData();

    // Add reference image (required)
    if (project.avatar) {
      if (project.avatar.type === 'upload') {
        formData.append('reference_image', project.avatar.data.file);
      } else {
        // For library avatars, we need to fetch the image and send it
        const imageResponse = await fetch(project.avatar.data.url);
        const imageBlob = await imageResponse.blob();
        formData.append('reference_image', imageBlob, 'avatar.jpg');
      }
    }

    // Add text input for TTS (required if no audio file)
    formData.append('text_input', project.script.text);

    // Add prompt (required) - describes the scene/avatar behavior
    const prompt = this.buildPrompt(project);
    formData.append('prompt', prompt);

    // Add emotion based on voice tone
    const emotion = this.mapVoiceToneToEmotion(project.voice.selected?.tone);
    formData.append('emotion', emotion);

    // Add style
    formData.append('style', 'testimonial');

    // Add tier
    formData.append('tier', 'standard');

    const response = await fetch(`${this.baseUrl}/api/v1/videos/generate`, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse<VideoResponse>(response);
  }

  /**
   * Build a descriptive prompt for the video generation
   */
  private buildPrompt(project: VideoProjectState): string {
    const parts: string[] = [];

    // Avatar description
    if (project.avatar?.type === 'library') {
      parts.push(`Professional avatar named ${project.avatar.data.name}`);
    } else {
      parts.push('Person speaking to camera');
    }

    // Voice/emotion context
    if (project.voice.selected) {
      parts.push(`with ${project.voice.selected.tone} tone`);
    }

    // Background context
    if (project.video.background.type === 'color') {
      parts.push('against solid background');
    } else if (project.video.background.type === 'gradient') {
      parts.push('with gradient background');
    }

    return parts.join(' ') + '. Speaking directly to camera, natural facial expressions and lip sync.';
  }

  /**
   * Map voice tone to backend emotion enum
   */
  private mapVoiceToneToEmotion(tone?: string): string {
    const mapping: Record<string, string> = {
      professional: 'neutral',
      casual: 'neutral',
      energetic: 'excited',
      calm: 'calm',
    };
    return mapping[tone || 'professional'] || 'neutral';
  }

  /**
   * Get generation status by video ID
   */
  async getGenerationStatus(videoId: string | number): Promise<GenerationProgress> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/videos/${videoId}/status`
    );
    const status = await this.handleResponse<VideoStatusResponse>(response);
    return this.mapStatusToProgress(status);
  }

  /**
   * Get full video details
   */
  async getVideo(videoId: string | number): Promise<VideoResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/videos/${videoId}`
    );
    return this.handleResponse<VideoResponse>(response);
  }

  /**
   * Delete a video
   */
  async deleteVideo(videoId: string | number): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/videos/${videoId}`,
      { method: 'DELETE' }
    );
    return this.handleResponse(response);
  }

  /**
   * Health check - verify backend is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();

/**
 * Poll generation status until completion
 */
export async function pollGenerationStatus(
  videoId: string | number,
  onProgress: (progress: GenerationProgress) => void,
  interval: number = 3000
): Promise<GenerationProgress> {
  return new Promise((resolve, reject) => {
    let cancelled = false;

    const poll = async () => {
      if (cancelled) {
        resolve({
          status: 'cancelled',
          progress: 0,
          stage: 'queued',
          message: 'Generation cancelled',
        });
        return;
      }

      try {
        const progress = await apiService.getGenerationStatus(videoId);
        onProgress(progress);

        if (progress.status === 'completed' || progress.status === 'failed') {
          resolve(progress);
        } else {
          setTimeout(poll, interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();

    // Return cancel function
    return () => {
      cancelled = true;
    };
  });
}

/**
 * Download video file
 */
export function downloadVideo(url: string, filename: string = 'ugc-avatar-video.mp4'): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Check if backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  return apiService.healthCheck();
}
