/**
 * AvatarSelector Component
 *
 * A two-mode avatar selection component for UGC platforms.
 * Allows users to choose from a library or upload their own avatar.
 */

export { AvatarSelector, default } from './AvatarSelector';
export type {
  AvatarSelectorProps,
  AvatarSelection,
  LibrarySelection,
  UploadSelection,
  LibraryAvatar,
  SelectionMode,
  UploadState,
  FileValidationResult,
} from './types';
export { defaultAvatarLibrary, placeholderAvatarDataUrl } from './defaultAvatars';
export {
  validateFile,
  generatePreviewUrl,
  formatFileSize,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_ACCEPTED_TYPES,
  ACCEPTED_EXTENSIONS,
} from './utils';
