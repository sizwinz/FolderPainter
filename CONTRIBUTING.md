# Contributing to FolderPainter

Thank you for your interest in contributing to FolderPainter. We welcome bug reports, feature requests, documentation improvements, and code contributions from the open-source community.

Please take a few moments to review these guidelines before submitting an issue or pull request.

---

## Code of Conduct

We are committed to providing a welcoming, productive, and harassment-free environment for all contributors regardless of experience level, background, or identity. Please maintain professional, respectful, and constructive communication in all issues, pull requests, and discussions.

---

## Getting Started

### Prerequisites

To build and run FolderPainter locally, ensure your workstation meets the following requirements:

- **Operating System:** Windows 10 (Version 19041 or higher) or Windows 11 (x64 or ARM64)
- **Node.js:** v18.0.0 or higher (LTS recommended)
- **Rust:** v1.75.0 or higher (`rustup default stable`)
- **Visual Studio C++ Build Tools:** Desktop development with C++ workload (required for MSVC linking)

### Local Development Setup

1. Fork the repository on GitHub:
   `https://github.com/sizwinz/FolderPainter`

2. Clone your fork locally:
   ```powershell
   git clone https://github.com/<your-username>/FolderPainter.git
   cd FolderPainter
   ```

3. Install frontend dependencies:
   ```powershell
   npm install
   ```

4. Launch the application in development mode:
   ```powershell
   npm run tauri dev
   ```

---

## Architectural Guidelines

FolderPainter maintains strict separation of concerns across two primary layers:

### 1. Frontend (React 19 + TypeScript + Tailwind CSS v4)
- **Type Safety:** Avoid `any`. Define robust interfaces in `src/lib/types.ts`.
- **State Management:** Keep state centralized in custom hooks (`src/hooks/useFolderIcon.ts`, `src/hooks/useTheme.ts`).
- **UI & UX Standards:** Maintain desktop and mobile viewport responsiveness. Adhere to modern minimalism with light/dark theme adaptability and subtle, translucent floating scrollbars.

### 2. Backend (Rust + Win32 Shell API Bridge)
- **Win32 Shell Invariants:** Any modification to folder appearances must preserve `desktop.ini` metadata, set `FILE_ATTRIBUTE_SYSTEM` on target folders, and dispatch `SHChangeNotify` (`SHCNE_UPDATEITEM`, `SHCNE_UPDATEDIR`, `SHCNE_ASSOCCHANGED`).
- **Permanent Fixes:** Root-cause issues thoroughly. Never implement patch fixes, error suppressions, or band-aid solutions.
- **Error Handling:** Return structured `Result<T, String>` from Tauri commands with informative, actionable error descriptions.

---

## Verification and Testing

Every contribution must pass all automated test suites before being merged:

### Backend Test Suite (Rust)
```powershell
cd src-tauri
cargo test
```
All unit tests covering INI merging, procedural ICO generation, directory tree recursion, and undo/redo stacks must pass.

### Frontend Compilation Check (TypeScript & Vite)
```powershell
npm run build
```
The TypeScript compiler (`tsc`) and Vite production bundler must complete with zero errors and zero warnings.

---

## Git Commit Conventions

We follow the Conventional Commits specification. Write clear, concise, and descriptive commit messages:

- `feat:` Introduces a new user-facing feature or capability.
- `fix:` Patches a bug or resolves an unexpected behavior.
- `docs:` Documentation changes, README updates, or asset references.
- `refactor:` Code improvements that do not alter external behavior.
- `test:` Adding or updating automated tests.
- `chore:` Tooling, dependency, or configuration updates.

Example:
```
feat: add recursive subfolder icon application toggle
fix: force Windows Explorer icon cache invalidation on undo
docs: update architecture overview in README
```

---

## Pull Request Checklist

Before opening a pull request, verify that:

- [ ] The branch is created from `main` with a descriptive name (e.g. `feat/custom-icon-filters`).
- [ ] Backend tests pass (`cargo test`).
- [ ] Frontend builds cleanly with zero TypeScript errors (`npm run build`).
- [ ] No temporary files, build artifacts (`dist/`, `target/`), or secrets are committed.
- [ ] The pull request description clearly outlines the problem solved, architectural changes made, and manual testing steps performed.

Thank you for helping make FolderPainter better for everyone.
