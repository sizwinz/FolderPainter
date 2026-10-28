import { useState } from "react";
import {
  Folder,
  FolderOpen,
  Check,
  RotateCcw,
  Undo,
  Redo,
  Sun,
  Moon,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
  Palette,
  Sliders,
  Image,
  History,
  ArrowDownCircle,
  Download,
} from "lucide-react";
import logoUrl from "./assets/logo.png";
import { IconLibraryTab } from "./components/IconLibraryTab";
import { IconGrid } from "./components/IconGrid";
import { ColorWheel } from "./components/ColorWheel";
import { CustomIconTab } from "./components/CustomIconTab";
import { HistoryTab } from "./components/HistoryTab";
import { useTheme } from "./hooks/useTheme";
import { useFolderIcon } from "./hooks/useFolderIcon";
import { useUpdater } from "./hooks/useUpdater";
import { selectFolderDialog } from "./lib/invoke";
import type { MainTabType } from "./lib/types";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const updater = useUpdater();
  const [currentTab, setCurrentTab] = useState<MainTabType>("library");
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    selectedFolder,
    currentFolderIcon,
    selectedIconPath,
    previewColorHex,
    previewImageUrl,
    isApplying,
    isPreparingIcon,
    undoInfo,
    statusMessage,
    selectFolder,
    selectColorPreset,
    selectRemoteIcon,
    selectCustomImagePath,
    apply,
    restore,
    undo,
    redo,
    clearStatus,
  } = useFolderIcon();

  const handleBrowseFolder = async () => {
    const path = await selectFolderDialog();
    if (path) {
      selectFolder(path);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const path = (file as unknown as { path?: string }).path;
      if (path) {
        selectFolder(path);
      }
    }
  };

  const canApply = Boolean(selectedFolder && (selectedIconPath || previewImageUrl) && !isApplying && !isPreparingIcon);
  const canRestore = Boolean(selectedFolder && !isApplying);

  return (
    <div className="flex h-screen w-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased overflow-hidden select-none">
      {/* Left Workspace Panel */}
      <aside className="w-72 shrink-0 h-screen flex flex-col justify-between border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/50 p-4">
        <div className="space-y-3.5">
          {/* App Brand Header */}
          <div className="flex items-center gap-2.5 px-1 pt-0.5 pb-1">
            <img
              src={logoUrl}
              alt="FolderPainter"
              className="w-8 h-8 object-contain drop-shadow-sm select-none"
            />
            <div>
              <h1 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
                FolderPainter
              </h1>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                Windows Icon Studio
              </p>
            </div>
          </div>

          {/* Big Folder Preview Box */}
          <div className="w-full h-44 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-3 shadow-xs">
            {isPreparingIcon ? (
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-[11px] font-medium">Preparing Icon...</span>
              </div>
            ) : previewImageUrl ? (
              <img
                src={previewImageUrl}
                alt="Selected icon"
                className="w-28 h-28 object-contain drop-shadow-md transition-transform hover:scale-105"
              />
            ) : previewColorHex ? (
              <Folder
                className="w-28 h-28 drop-shadow-md transition-colors"
                style={{
                  fill: previewColorHex,
                  color: previewColorHex,
                }}
              />
            ) : (
              <Folder className="w-28 h-28 text-amber-400 fill-amber-400 drop-shadow-md" />
            )}
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold mt-1">
              {previewImageUrl || previewColorHex ? "Custom Selection" : "Standard Folder"}
            </div>
          </div>

          {/* Target Folder Selection Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-3.5 rounded-xl border text-center transition-all ${
              isDragOver
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            }`}
          >
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              {selectedFolder ? "Target Folder" : "Choose folder or drop here"}
            </div>

            {selectedFolder ? (
              <div className="mt-1 flex items-center justify-between gap-1.5 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <span
                  className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate text-left"
                  title={selectedFolder}
                >
                  {selectedFolder}
                </span>
                <button
                  onClick={() => selectFolder("")}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}

            <button
              onClick={handleBrowseFolder}
              className="mt-2.5 w-full py-1.5 px-3 text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 rounded-lg transition-opacity flex items-center justify-center gap-1.5 shadow-xs"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{selectedFolder ? "Change Folder" : "+ Add Folder"}</span>
            </button>
          </div>

          {/* Actions & Undo controls */}
          <div className="space-y-2">
            <button
              onClick={apply}
              disabled={!canApply}
              className="w-full py-2.5 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xs shadow-blue-500/20"
            >
              {isApplying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
              <span>Apply to Folder</span>
            </button>

            <button
              onClick={restore}
              disabled={!canRestore}
              className="w-full py-2 px-3 text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Default Icon</span>
            </button>
          </div>

          {/* Quick Undo / Redo */}
          <div className="flex gap-2">
            <button
              onClick={undo}
              disabled={!undoInfo.can_undo || isApplying}
              title="Undo last icon change"
              className="flex-1 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Undo className="w-3.5 h-3.5" />
              <span>Undo ({undoInfo.undo_count})</span>
            </button>
            <button
              onClick={redo}
              disabled={!undoInfo.can_redo || isApplying}
              title="Redo change"
              className="flex-1 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Redo className="w-3.5 h-3.5" />
              <span>Redo</span>
            </button>
          </div>
        </div>

        {/* Status Alert Footer */}
        {statusMessage ? (
          <div
            className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
              statusMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : statusMessage.type === "error"
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                : "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            }`}
          >
            {statusMessage.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />}
            {statusMessage.type === "error" && <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />}
            {statusMessage.type === "info" && <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="leading-tight">{statusMessage.text}</p>
            </div>
            <button onClick={clearStatus} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : currentFolderIcon ? (
          <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
            Active: <span className="font-mono text-zinc-700 dark:text-zinc-300">{currentFolderIcon}</span>
          </div>
        ) : null}
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 flex flex-col h-screen min-w-0 bg-white dark:bg-zinc-950">
        {/* Top Header with Segmented Navigation and Theme Toggle */}
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-5 flex items-center justify-between shrink-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xs">
          {/* Segmented Tab Controls */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
            <button
              onClick={() => setCurrentTab("library")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                currentTab === "library"
                  ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Icon Library</span>
            </button>

            <button
              onClick={() => setCurrentTab("presets")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                currentTab === "presets"
                  ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Color Presets</span>
            </button>

            <button
              onClick={() => setCurrentTab("custom_color")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                currentTab === "custom_color"
                  ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Custom HSL</span>
            </button>

            <button
              onClick={() => setCurrentTab("import_image")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                currentTab === "import_image"
                  ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Image className="w-3.5 h-3.5" />
              <span>Import Image</span>
            </button>

            <button
              onClick={() => setCurrentTab("history")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                currentTab === "history"
                  ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
          </div>

          {/* Action Buttons: Updates + Theme */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => updater.checkForUpdates(true)}
              disabled={updater.status.state === "checking" || updater.status.state === "downloading"}
              title="Check for application updates"
              className="px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 disabled:opacity-50"
            >
              {updater.status.state === "checking" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <ArrowDownCircle className="w-3.5 h-3.5" />
                  <span>Updates</span>
                </>
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-800"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-600" />
              )}
            </button>
          </div>
        </header>

        {/* Update Notification Banners */}
        {updater.status.state === "available" && (
          <div className="mx-5 mt-3 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  Version {updater.status.version} is available
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  {updater.status.body || "New features and enhancements are ready."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={updater.downloadAndInstallUpdate}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                Download & Install
              </button>
              <button
                onClick={updater.dismiss}
                className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {updater.status.state === "downloading" && (
          <div className="mx-5 mt-3 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center gap-3 shadow-xs">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">
                <span>Downloading update...</span>
                {updater.status.total ? (
                  <span>
                    {Math.round(((updater.status.downloaded ?? 0) / updater.status.total) * 100)}%
                  </span>
                ) : null}
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-200"
                  style={{
                    width: updater.status.total
                      ? `${Math.round(((updater.status.downloaded ?? 0) / updater.status.total) * 100)}%`
                      : "40%",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {updater.status.state === "upToDate" && (
          <div className="mx-5 mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>FolderPainter is up to date (v0.1.0).</span>
            </div>
            <button onClick={updater.dismiss} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {updater.status.state === "error" && (
          <div className="mx-5 mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-between text-xs text-rose-800 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Update check: {updater.status.error || "Unable to reach release server"}</span>
            </div>
            <button onClick={updater.dismiss} className="text-rose-600 hover:text-rose-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Content Body */}
        <section className="flex-1 overflow-hidden p-5">
          {currentTab === "library" && (
            <IconLibraryTab
              selectedImageUrl={previewImageUrl}
              onSelectIcon={selectRemoteIcon}
            />
          )}

          {currentTab === "presets" && (
            <div className="overflow-y-auto h-full pr-1">
              <IconGrid
                selectedIconPath={selectedIconPath}
                onSelectIcon={selectColorPreset}
              />
            </div>
          )}

          {currentTab === "custom_color" && (
            <div className="overflow-y-auto h-full pr-1">
              <ColorWheel onSelectIcon={selectColorPreset} />
            </div>
          )}

          {currentTab === "import_image" && (
            <div className="overflow-y-auto h-full pr-1">
              <CustomIconTab onSelectIcon={selectCustomImagePath} />
            </div>
          )}

          {currentTab === "history" && (
            <div className="overflow-y-auto h-full pr-1">
              <HistoryTab
                undoInfo={undoInfo}
                onUndo={undo}
                onRedo={redo}
                isApplying={isApplying}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
