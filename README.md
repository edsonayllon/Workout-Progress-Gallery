# Workout Progress Gallery

A React app for tracking workout progress through photos with editable metadata overlays.

## Features

- **Photo Upload** - Upload images including Apple HEIC format (automatically converted to JPEG)
- **EXIF Date Extraction** - Automatically reads photo date from image metadata
- **Metadata Overlay** - Display date, weight, and custom measurements on each photo
- **Editable Fields** - Edit date, weight (lbs), and add custom measurements (inches)
- **Chronological View** - Photos sorted by date with "X days later" indicator
- **Keyboard Navigation** - Use left/right arrow keys to navigate between photos
- **Local Storage** - All data persists in your browser

## Todo

- [x] Full screen photo view
- [x] Make PWA so can download as app on phone
- [x] Add multiple galleries
- [x] Add global and local config
- [ ] Let users set reverse chronological if they want, instead of n days later, show n days before
- [x] Add missing tests

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- heic-decode (HEIC to JPEG conversion)
- exifr (EXIF metadata extraction)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

## Usage

1. Click **"+ Add Photo"** to upload a progress photo
2. The photo date is automatically extracted from EXIF data (or falls back to file date)
3. Edit the **date**, **weight**, and **measurements** in the right panel
4. Use **Previous/Next** buttons or **arrow keys** to navigate between photos
5. Only measurements with values are displayed on the photo overlay

## Data Storage

All photos and metadata are stored in your browser's localStorage. Data persists across sessions but is specific to your browser/device.
