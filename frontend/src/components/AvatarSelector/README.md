# AvatarSelector Component

A production-ready, accessible React component for avatar selection in UGC (User Generated Content) platforms. Supports two modes: choosing from a pre-built library or uploading custom images.

## Features

- **Two-mode selection**: Tab-based interface switching between library and upload modes
- **Responsive design**: Grid layout adapts from 4 columns on desktop to 2 on mobile
- **Drag and drop**: Full drag-and-drop support for file uploads
- **File validation**: Configurable file size limits and accepted formats
- **Instant previews**: Base64 preview generation for uploaded images
- **Accessibility**: Full keyboard navigation, ARIA labels, and screen reader support
- **TypeScript**: Complete type definitions for all props and callbacks

## Installation

The component requires the following dependencies (already included in the project):

```bash
npm install clsx
```

## Usage

### Basic Usage

```tsx
import { AvatarSelector, AvatarSelection } from '@/components/AvatarSelector';

function MyComponent() {
  const handleAvatarSelect = (selection: AvatarSelection | null) => {
    if (selection) {
      if (selection.type === 'library') {
        console.log('Selected library avatar:', selection.data);
        // { id: string, url: string, name: string }
      } else {
        console.log('Uploaded custom avatar:', selection.data);
        // { file: File, previewUrl: string, fileName: string, fileSize: number }
      }
    }
  };

  return (
    <AvatarSelector
      onAvatarSelect={handleAvatarSelect}
    />
  );
}
```

### With Custom Options

```tsx
import { AvatarSelector, LibraryAvatar } from '@/components/AvatarSelector';

const customAvatars: LibraryAvatar[] = [
  { id: '1', url: '/my-avatar-1.png', name: 'Avatar 1' },
  { id: '2', url: '/my-avatar-2.png', name: 'Avatar 2' },
];

function MyComponent() {
  return (
    <AvatarSelector
      onAvatarSelect={(selection) => console.log(selection)}
      defaultMode="upload"
      maxFileSize={5 * 1024 * 1024} // 5MB
      avatarLibrary={customAvatars}
      acceptedFileTypes={['image/png', 'image/jpeg']}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onAvatarSelect` | `(selection: AvatarSelection \| null) => void` | **Required** | Callback fired when an avatar is selected or deselected |
| `defaultMode` | `'library' \| 'upload'` | `'library'` | Initial tab to display |
| `maxFileSize` | `number` | `10485760` (10MB) | Maximum file size for uploads in bytes |
| `avatarLibrary` | `LibraryAvatar[]` | Default 12 avatars | Custom avatar library to display |
| `acceptedFileTypes` | `string[]` | `['image/png', 'image/jpeg', 'image/jpg', 'image/webp']` | MIME types accepted for upload |
| `className` | `string` | - | Additional CSS classes for the container |
| `disabled` | `boolean` | `false` | Disable all interactions |

## Types

### AvatarSelection

```typescript
type AvatarSelection = LibrarySelection | UploadSelection;

interface LibrarySelection {
  type: 'library';
  data: {
    id: string;
    url: string;
    name: string;
  };
}

interface UploadSelection {
  type: 'upload';
  data: {
    file: File;
    previewUrl: string;
    fileName: string;
    fileSize: number;
  };
}
```

### LibraryAvatar

```typescript
interface LibraryAvatar {
  id: string;
  url: string;
  name: string;
  category?: string;
}
```

## File Structure

```
src/components/AvatarSelector/
├── AvatarSelector.tsx    # Main component
├── types.ts              # TypeScript type definitions
├── utils.ts              # Utility functions (validation, preview generation)
├── defaultAvatars.ts     # Default avatar library data
├── index.ts              # Public exports
└── README.md             # This file
```

## Utility Functions

The component exports several utility functions for advanced use cases:

```typescript
import {
  validateFile,
  generatePreviewUrl,
  formatFileSize,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_ACCEPTED_TYPES,
} from '@/components/AvatarSelector';

// Validate a file before processing
const result = validateFile(file, maxSize, acceptedTypes);
if (!result.valid) {
  console.error(result.error);
}

// Generate a preview URL
const previewUrl = await generatePreviewUrl(file);

// Format file size for display
const sizeStr = formatFileSize(1048576); // "1 MB"
```

## Accessibility

The component follows WAI-ARIA best practices:

- Tab navigation between Library and Upload modes
- Keyboard navigation (Enter/Space) for avatar selection
- ARIA roles (`tablist`, `tab`, `tabpanel`, `listbox`, `option`)
- Focus indicators with visible ring styling
- Screen reader labels for all interactive elements

## Styling

The component uses Tailwind CSS and can be customized through:

1. The `className` prop for container styling
2. Tailwind theme customization in `tailwind.config.js`
3. CSS custom properties (e.g., primary color scheme)

## Example Integration

```tsx
// In your video creation workflow
import { AvatarSelector, AvatarSelection } from '@/components/AvatarSelector';

function VideoCreationForm() {
  const [avatar, setAvatar] = useState<AvatarSelection | null>(null);
  const [script, setScript] = useState('');

  const handleSubmit = async () => {
    if (!avatar) {
      alert('Please select an avatar');
      return;
    }

    const formData = new FormData();

    if (avatar.type === 'upload') {
      formData.append('reference_image', avatar.data.file);
    } else {
      formData.append('avatar_id', avatar.data.id);
    }

    formData.append('text_input', script);

    // Submit to your backend
    await fetch('/api/v1/videos/generate', {
      method: 'POST',
      body: formData,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <AvatarSelector onAvatarSelect={setAvatar} />
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="Enter your script..."
      />
      <button type="submit" disabled={!avatar}>
        Generate Video
      </button>
    </form>
  );
}
```
