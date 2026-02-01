/**
 * Default avatar library for the AvatarSelector component
 * These are placeholder avatars - replace with actual AI-generated avatar URLs
 */

import { LibraryAvatar } from './types';

/**
 * Default library of AI avatars
 * In production, these would be loaded from your backend API or CDN
 */
export const defaultAvatarLibrary: LibraryAvatar[] = [
  {
    id: 'avatar-1',
    url: '/avatars/James.jpg',
    name: 'James',
    category: 'professional',
  },
  {
    id: 'avatar-2',
    url: '/avatars/Nick.png',
    name: 'Nick',
    category: 'casual',
  },
];

/**
 * Placeholder avatar data URL for when images fail to load
 */
export const placeholderAvatarDataUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23e2e8f0' width='200' height='200'/%3E%3Ccircle cx='100' cy='70' r='40' fill='%2394a3b8'/%3E%3Cellipse cx='100' cy='170' rx='60' ry='50' fill='%2394a3b8'/%3E%3C/svg%3E`;
