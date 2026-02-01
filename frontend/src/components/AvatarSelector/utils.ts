/**
 * Utility functions for avatar selection and file handling
 */

import { FileValidationResult } from './types';

/** Default maximum file size (10MB) */
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Default accepted file types */
export const DEFAULT_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

/** Accepted file extensions for display */
export const ACCEPTED_EXTENSIONS = '.png, .jpg, .jpeg, .webp';

/**
 * Validates an uploaded file against size and type constraints
 */
export function validateFile(
  file: File,
  maxSize: number = DEFAULT_MAX_FILE_SIZE,
  acceptedTypes: string[] = DEFAULT_ACCEPTED_TYPES
): FileValidationResult {
  // Check file type
  if (!acceptedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Please upload ${ACCEPTED_EXTENSIONS} files only.`,
    };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB.`,
    };
  }

  return { valid: true };
}

/**
 * Generates a preview URL for an image file using FileReader
 */
export function generatePreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Revokes an object URL to prevent memory leaks
 */
export function revokePreviewUrl(url: string | null): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Generates a unique ID for library avatars
 */
export function generateAvatarId(): string {
  return `avatar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
