/**
 * Types for the AvatarSelector component
 */

/** Avatar item from the library */
export interface LibraryAvatar {
  id: string;
  url: string;
  name: string;
  category?: string;
}

/** Selection data when choosing from the library */
export interface LibrarySelection {
  type: 'library';
  data: {
    id: string;
    url: string;
    name: string;
  };
}

/** Selection data when uploading a custom avatar */
export interface UploadSelection {
  type: 'upload';
  data: {
    file: File;
    previewUrl: string;
    fileName: string;
    fileSize: number;
  };
}

/** Combined avatar selection type */
export type AvatarSelection = LibrarySelection | UploadSelection;

/** Selection mode (tab) */
export type SelectionMode = 'library' | 'upload';

/** Props for the AvatarSelector component */
export interface AvatarSelectorProps {
  /** Callback fired when an avatar is selected */
  onAvatarSelect: (selection: AvatarSelection | null) => void;
  /** Initial mode to display (defaults to 'library') */
  defaultMode?: SelectionMode;
  /** Maximum file size for uploads in bytes (defaults to 10MB) */
  maxFileSize?: number;
  /** Custom avatar library to display (optional - uses default if not provided) */
  avatarLibrary?: LibraryAvatar[];
  /** Accepted file types for upload */
  acceptedFileTypes?: string[];
  /** Additional CSS class names */
  className?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
}

/** File validation result */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/** Upload state for tracking upload progress and errors */
export interface UploadState {
  file: File | null;
  previewUrl: string | null;
  isLoading: boolean;
  error: string | null;
  isDragging: boolean;
}
