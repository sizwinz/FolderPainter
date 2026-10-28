# FolderPainter

FolderPainter is a modern, lightweight, open-source desktop utility for Windows that allows users to color-code folders, apply custom icons, convert images to multi-resolution `.ico` files, and manage folder appearances with persistent undo/redo history.

Built with **Tauri 2**, **React 18**, **TypeScript**, **Tailwind CSS**, and **Rust**.

---

## Key Features

- **13 Windows Preset Colors**: Classic and modern folder shades (Crimson Red, Cobalt Blue, Emerald Green, Sunflower Yellow, etc.) tuned for Windows Explorer contrast.
- **Custom HSL Color Engine**: Procedural generation of folder icons from any Hue, Saturation, and Lightness combination.
- **Multi-Resolution ICO Encoding**: Generates multi-frame ICO containers (256x256, 48x48, 32x32, 16x16) compatible with Windows Extra Large, Large, Medium, and Details Explorer views.
- **Custom Image Converter**: Converts PNG, JPG, BMP, and WebP images into Windows `.ico` format with automatic aspect-ratio fitting and transparency preservation.
- **Safe Section Merging**: Edits `desktop.ini` by updating only the `[.ShellClassInfo]` section, preserving existing `[ViewState]` or other custom metadata.
- **Windows Explorer Live Refresh**: Triggers native `SHChangeNotify` with `SHCNE_UPDATEDIR` so changes reflect instantly in Explorer without restarting `explorer.exe`.
- **Persistent Undo / Redo**: Stores mutation history across application restarts, allowing users to revert or reapply changes at any time.
- **Light & Dark Theme**: Adaptive UI with system preference detection and manual toggle.

---

## Architecture Overview

```
FolderPainter/
  src/                               # Frontend (React 18 + TypeScript + Tailwind CSS)
    components/
      FolderPicker.tsx               # Native folder browse & drag-and-drop target
      IconGrid.tsx                   # Responsive preset grid with live previews
      ColorWheel.tsx                 # Interactive HSL generator
      CustomIconTab.tsx              # Image-to-icon converter
      ActionBar.tsx                  # Apply, Restore, Undo, Redo controls
      Sidebar.tsx                    # Navigation and theme switch
      HistoryTab.tsx                 # Undo/redo stack viewer
    hooks/
      useFolderIcon.ts               # Core application state machine
      useTheme.ts                    # Dark/light theme persistence
    lib/
      invoke.ts                      # Typed Tauri IPC wrappers
      types.ts                       # Shared interface definitions
  src-tauri/                         # Backend (Rust + Win32 Shell API)
    src/
      shell/
        desktop_ini.rs               # INI parser and section merger
        attributes.rs                # Win32 folder attribute assignment (System + ReadOnly)
        notify.rs                    # Win32 SHChangeNotify invocation
      commands/
        folder_icon.rs               # Apply, restore, and query folder icon commands
        color_icons.rs               # Procedural HSL rendering & multi-resolution ICO encoder
        icon_convert.rs              # Image file conversion to ICO
        undo.rs                      # Persistent undo/redo engine
```

---

## How It Works (Win32 Shell Mechanism)

Windows File Explorer looks for custom folder icons using the following protocol:

1. **`desktop.ini` File**: FolderPainter writes or updates `desktop.ini` inside the target directory:
   ```ini
   [.ShellClassInfo]
   IconResource=C:\Path\To\Icon.ico,0
   ```
2. **Hidden and System Attributes on `desktop.ini`**: Prevents `desktop.ini` from cluttering user views.
3. **Folder System / ReadOnly Attributes**: Windows Explorer only reads `desktop.ini` if the target folder has the `FILE_ATTRIBUTE_SYSTEM` or `FILE_ATTRIBUTE_READONLY` flag set (`SetFileAttributesW`).
4. **Shell Notification**: Calls `SHChangeNotify(SHCNE_UPDATEDIR, SHCNF_PATHW, folder_path, NULL)` from `shell32.dll` to instruct the Windows Shell to invalidate its icon cache for the updated path.

---

## Getting Started

### Prerequisites

- Node.js 18+ (tested with v26)
- Rust 1.75+ (tested with v1.97)
- Windows 10 (version 19041+) or Windows 11

### Installation & Development

```bash
# Navigate to project folder
cd FolderPainter

# Install frontend dependencies
npm install

# Run application in development mode
npm run tauri dev
```

### Production Build

```bash
npm run tauri build
```

This compiles the Rust backend in release mode with LTO and produces a standalone Windows installer and portable `.exe` in `src-tauri/target/release/`.

---

## Verification & Manual Testing Steps

1. **Launch App**: Run `npm run tauri dev`.
2. **Select Target Folder**: Click **Browse** and pick any test folder (e.g. `C:\Users\<user>\Desktop\TestFolder`).
3. **Choose Preset Color**: Click on "Sunflower Yellow" or "Cobalt Blue". The preview pill updates to indicate the icon is ready.
4. **Apply Icon**: Click **Apply to Folder**. Notice the notification "Custom icon applied successfully to folder".
5. **Inspect Explorer**: Open Windows File Explorer and navigate to your test folder. Notice the icon is now customized.
6. **Test Undo**: Click **Undo**. The folder icon reverts to the standard yellow Windows icon immediately.
7. **Test Custom Image Import**: Navigate to the **Import Image** tab, drop a PNG image, and apply it to the folder.

---

## License

MIT License. Free for personal and commercial use.
