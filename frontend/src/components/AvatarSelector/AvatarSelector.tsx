'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  AvatarSelectorProps,
  SelectionMode,
  UploadState,
  LibraryAvatar,
  AvatarSelection,
} from './types';
import {
  validateFile,
  generatePreviewUrl,
  formatFileSize,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_ACCEPTED_TYPES,
  ACCEPTED_EXTENSIONS,
} from './utils';
import { defaultAvatarLibrary, placeholderAvatarDataUrl } from './defaultAvatars';

/**
 * AvatarSelector Component
 *
 * A two-mode avatar selection component that allows users to either:
 * 1. Choose from a pre-built library of AI avatars
 * 2. Upload their own custom avatar image
 *
 * @example
 * ```tsx
 * <AvatarSelector
 *   onAvatarSelect={(selection) => console.log(selection)}
 *   defaultMode="library"
 *   maxFileSize={10 * 1024 * 1024}
 * />
 * ```
 */
export function AvatarSelector({
  onAvatarSelect,
  defaultMode = 'library',
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  avatarLibrary = defaultAvatarLibrary,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  className,
  disabled = false,
}: AvatarSelectorProps) {
  // State
  const [mode, setMode] = useState<SelectionMode>(defaultMode);
  const [selectedLibraryAvatar, setSelectedLibraryAvatar] = useState<LibraryAvatar | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    previewUrl: null,
    isLoading: false,
    error: null,
    isDragging: false,
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (uploadState.previewUrl && !uploadState.previewUrl.startsWith('data:')) {
        URL.revokeObjectURL(uploadState.previewUrl);
      }
    };
  }, [uploadState.previewUrl]);

  /**
   * Handle mode (tab) change
   */
  const handleModeChange = useCallback(
    (newMode: SelectionMode) => {
      if (disabled) return;
      setMode(newMode);

      // Notify parent of current selection based on new mode
      if (newMode === 'library' && selectedLibraryAvatar) {
        onAvatarSelect({
          type: 'library',
          data: {
            id: selectedLibraryAvatar.id,
            url: selectedLibraryAvatar.url,
            name: selectedLibraryAvatar.name,
          },
        });
      } else if (newMode === 'upload' && uploadState.file && uploadState.previewUrl) {
        onAvatarSelect({
          type: 'upload',
          data: {
            file: uploadState.file,
            previewUrl: uploadState.previewUrl,
            fileName: uploadState.file.name,
            fileSize: uploadState.file.size,
          },
        });
      } else {
        onAvatarSelect(null);
      }
    },
    [disabled, selectedLibraryAvatar, uploadState, onAvatarSelect]
  );

  /**
   * Handle library avatar selection
   */
  const handleLibrarySelect = useCallback(
    (avatar: LibraryAvatar) => {
      if (disabled) return;
      setSelectedLibraryAvatar(avatar);
      onAvatarSelect({
        type: 'library',
        data: {
          id: avatar.id,
          url: avatar.url,
          name: avatar.name,
        },
      });
    },
    [disabled, onAvatarSelect]
  );

  /**
   * Process uploaded file
   */
  const processFile = useCallback(
    async (file: File) => {
      if (disabled) return;

      // Validate file
      const validation = validateFile(file, maxFileSize, acceptedFileTypes);
      if (!validation.valid) {
        setUploadState((prev) => ({
          ...prev,
          error: validation.error || 'Invalid file',
          isLoading: false,
        }));
        return;
      }

      // Set loading state
      setUploadState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        // Generate preview
        const previewUrl = await generatePreviewUrl(file);

        setUploadState({
          file,
          previewUrl,
          isLoading: false,
          error: null,
          isDragging: false,
        });

        // Notify parent
        onAvatarSelect({
          type: 'upload',
          data: {
            file,
            previewUrl,
            fileName: file.name,
            fileSize: file.size,
          },
        });
      } catch {
        setUploadState((prev) => ({
          ...prev,
          error: 'Failed to process image. Please try again.',
          isLoading: false,
        }));
      }
    },
    [disabled, maxFileSize, acceptedFileTypes, onAvatarSelect]
  );

  /**
   * Handle file input change
   */
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        processFile(file);
      }
      // Reset input so same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processFile]
  );

  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled) {
        setUploadState((prev) => ({ ...prev, isDragging: true }));
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // Only set isDragging to false if we're leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(event.relatedTarget as Node)) {
      setUploadState((prev) => ({ ...prev, isDragging: false }));
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setUploadState((prev) => ({ ...prev, isDragging: false }));

      if (disabled) return;

      const file = event.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [disabled, processFile]
  );

  /**
   * Trigger file picker
   */
  const openFilePicker = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  /**
   * Clear uploaded file
   */
  const clearUpload = useCallback(() => {
    setUploadState({
      file: null,
      previewUrl: null,
      isLoading: false,
      error: null,
      isDragging: false,
    });
    onAvatarSelect(null);
  }, [onAvatarSelect]);

  /**
   * Handle keyboard navigation for avatars
   */
  const handleAvatarKeyDown = useCallback(
    (event: React.KeyboardEvent, avatar: LibraryAvatar) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleLibrarySelect(avatar);
      }
    },
    [handleLibrarySelect]
  );

  return (
    <div
      className={clsx(
        'w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-sm',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200" role="tablist" aria-label="Avatar selection mode">
        <button
          role="tab"
          aria-selected={mode === 'library'}
          aria-controls="library-panel"
          id="library-tab"
          onClick={() => handleModeChange('library')}
          className={clsx(
            'flex-1 px-4 py-3 text-sm font-medium transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            mode === 'library'
              ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Choose from Library
          </span>
        </button>
        <button
          role="tab"
          aria-selected={mode === 'upload'}
          aria-controls="upload-panel"
          id="upload-tab"
          onClick={() => handleModeChange('upload')}
          className={clsx(
            'flex-1 px-4 py-3 text-sm font-medium transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            mode === 'upload'
              ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Upload Your Own
          </span>
        </button>
      </div>

      {/* Content Panels */}
      <div className="p-4">
        {/* Library Panel */}
        {mode === 'library' && (
          <div
            role="tabpanel"
            id="library-panel"
            aria-labelledby="library-tab"
            className="animate-in fade-in duration-200"
          >
            <p className="text-sm text-gray-600 mb-4">
              Select an AI avatar from our curated collection
            </p>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto avatar-grid pr-1"
              role="listbox"
              aria-label="Avatar library"
            >
              {avatarLibrary.map((avatar) => (
                <div
                  key={avatar.id}
                  role="option"
                  aria-selected={selectedLibraryAvatar?.id === avatar.id}
                  tabIndex={0}
                  onClick={() => handleLibrarySelect(avatar)}
                  onKeyDown={(e) => handleAvatarKeyDown(e, avatar)}
                  className={clsx(
                    'relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                    selectedLibraryAvatar?.id === avatar.id
                      ? 'ring-2 ring-primary-500 ring-offset-2'
                      : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                  )}
                >
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = placeholderAvatarDataUrl;
                      }}
                    />
                  </div>
                  {/* Selection checkmark */}
                  {selectedLibraryAvatar?.id === avatar.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
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
                  )}
                  {/* Avatar name tooltip */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white font-medium truncate">{avatar.name}</p>
                  </div>
                </div>
              ))}
            </div>
            {selectedLibraryAvatar && (
              <div className="mt-4 p-3 bg-primary-50 rounded-lg flex items-center gap-3">
                <img
                  src={selectedLibraryAvatar.url}
                  alt={selectedLibraryAvatar.name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = placeholderAvatarDataUrl;
                  }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Selected: {selectedLibraryAvatar.name}
                  </p>
                  <p className="text-xs text-gray-500">AI Avatar from library</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Panel */}
        {mode === 'upload' && (
          <div
            role="tabpanel"
            id="upload-panel"
            aria-labelledby="upload-tab"
            className="animate-in fade-in duration-200"
          >
            <p className="text-sm text-gray-600 mb-4">
              Upload your own custom avatar image
            </p>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFileTypes.join(',')}
              onChange={handleFileChange}
              className="hidden"
              aria-hidden="true"
            />

            {/* Upload area or preview */}
            {!uploadState.file ? (
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={openFilePicker}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openFilePicker();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Upload avatar image. Click or drag and drop."
                className={clsx(
                  'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                  uploadState.isDragging
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                )}
              >
                {uploadState.isLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-600">Processing image...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className={clsx(
                          'w-14 h-14 rounded-full flex items-center justify-center transition-colors',
                          uploadState.isDragging ? 'bg-primary-100' : 'bg-gray-100'
                        )}
                      >
                        <svg
                          className={clsx(
                            'w-7 h-7 transition-colors',
                            uploadState.isDragging ? 'text-primary-500' : 'text-gray-400'
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {uploadState.isDragging ? 'Drop your image here' : 'Drag and drop your image here'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          or <span className="text-primary-600 font-medium">click to browse</span>
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        {ACCEPTED_EXTENSIONS} up to {formatFileSize(maxFileSize)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="relative">
                    <img
                      src={uploadState.previewUrl || ''}
                      alt="Uploaded avatar preview"
                      className="w-24 h-24 rounded-xl object-cover"
                    />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadState.file.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatFileSize(uploadState.file.size)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearUpload();
                      }}
                      className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
                {/* Replace button */}
                <button
                  onClick={openFilePicker}
                  className="w-full py-2.5 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Replace Image
                </button>
              </div>
            )}

            {/* Error message */}
            {uploadState.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
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
                <p className="text-sm text-red-700">{uploadState.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AvatarSelector;
