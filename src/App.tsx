import { useState, useEffect } from "react";
import {
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
  ArrowDownCircle,
  Download,
  Wrench,
  History,
  Wand2,
} from "lucide-react";
import logoUrl from "./assets/logo.png";
import { IconLibraryTab } from "./components/IconLibraryTab";
import { IconGrid, WindowsFolderIcon } from "./components/IconGrid";
import { ColorWheel } from "./components/ColorWheel";
import { CustomIconTab } from "./components/CustomIconTab";
import { IconDesignerTab } from "./components/IconDesignerTab";
import { useTheme } from "./hooks/useTheme";
import { useFolderIcon } from "./hooks/useFolderIcon";
import { useUpdater } from "./hooks/useUpdater";
import { repairIconCache, selectFolderDialog } from "./lib/invoke";
import type { MainTabType } from "./lib/types";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const updater = useUpdater();
  const [currentTab, setCurrentTab] = useState<MainTabType>("library");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Disable default browser right-click context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener("contextmenu", handleContextMenu);
    return () => window.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  // Silent auto-check for updates on application launch
  useEffect(() => {
    const timer = setTimeout(() => {
      updater.checkForUpdates(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const {
    selectedFolder,
    currentFolderIcon,
    folderCurrentPreviewUrl,
    showingFolderCurrentIcon,
    selectedIconPath,
    previewColorHex,
    previewImageUrl,
    applyToSubfolders,
    setApplyToSubfolders,
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
    undoSpecificEntry,
    showStatus,
    clearStatus,
  } = useFolderIcon();

  const handleRepairIcons = async () => {
    setIsRepairing(true);
    try {
      const msg = await repairIconCache();
      showStatus({
        text: msg || "Windows icon cache rebuilt successfully.",
        type: "success",
      });
    } catch (err: unknown) {
      showStatus({
        text: typeof err === "string" ? err : "Failed to repair icon cache.",
        type: "error",
      });
    } finally {
      setIsRepairing(false);
    }
  };

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

  const canApply = Boolean(
    selectedFolder &&
      (selectedIconPath || (!showingFolderCurrentIcon && (previewImageUrl || previewColorHex))) &&
      !isApplying &&
      !isPreparingIcon &&
      !showingFolderCurrentIcon
  );
  const canRestore = Boolean(selectedFolder && !isApplying);

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "Recent";
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="flex h-screen w-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased overflow-hidden select-none"
    >
      {/* Left Workspace Panel */}
      <aside className="w-64 lg:w-72 shrink-0 h-screen flex flex-col justify-between border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/50 p-3 lg:p-4 transition-all overflow-y-auto no-scrollbar">
        <div className="space-y-2.5">
          {/* App Brand Header */}
          <div className="flex items-center gap-2.5 px-1 pt-0.5 pb-1">
            <img
              src={logoUrl}
              alt="FolderPainter"
              className="w-8 h-8 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.30)] dark:drop-shadow-[0_4px_12px_rgba(0,0,0,0.60)] select-none transition-transform hover:scale-105"
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
          <div className="w-full h-34 lg:h-40 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-2.5 shadow-xs relative">
            {isPreparingIcon ? (
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                <span className="text-[11px] font-medium">Preparing Icon...</span>
              </div>
            ) : previewImageUrl ? (
              <img
                src={previewImageUrl}
                alt="Selected folder preview"
                className="w-20 h-20 lg:w-24 lg:h-24 object-contain drop-shadow-md transition-transform hover:scale-105"
              />
            ) : previewColorHex ? (
              <WindowsFolderIcon
                color={previewColorHex}
                className="w-20 h-20 lg:w-24 lg:h-24 drop-shadow-md transition-transform hover:scale-105"
              />
            ) : (
              <WindowsFolderIcon
                color="#FDD835"
                className="w-20 h-20 lg:w-24 lg:h-24 drop-shadow-md transition-transform hover:scale-105"
              />
            )}

            <div className="mt-1 flex items-center justify-center">
              {showingFolderCurrentIcon ? (
                currentFolderIcon ? (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                    Active Custom Icon
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    Active: Standard Folder
                  </span>
                )
              ) : (
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                  New Icon Ready to Apply
                </span>
              )}
            </div>
          </div>

          {/* Target Folder Selection Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-3 rounded-xl border text-center transition-all ${
              isDragOver
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            }`}
          >
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              {selectedFolder ? "Target Folder" : "Choose folder or drop here"}
            </div>

            {selectedFolder ? (
              <div className="mt-1.5 flex items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60">
                {/* Folder icon preview thumbnail */}
                <div className="w-7 h-7 shrink-0 rounded bg-white dark:bg-zinc-900 p-0.5 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
                  {folderCurrentPreviewUrl ? (
                    <img
                      src={folderCurrentPreviewUrl}
                      alt="Folder icon"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <WindowsFolderIcon color="#FDD835" className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div
                    className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate"
                    title={selectedFolder}
                  >
                    {selectedFolder.split(/[\\/]/).filter(Boolean).pop() || selectedFolder}
                  </div>
                  <div
                    className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate"
                    title={selectedFolder}
                  >
                    {selectedFolder}
                  </div>
                </div>

                <button
                  onClick={() => selectFolder("")}
                  title="Deselect folder"
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}

            <button
              onClick={handleBrowseFolder}
              className="mt-2 w-full py-1.5 px-3 text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 rounded-lg transition-opacity flex items-center justify-center gap-1.5 shadow-xs"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{selectedFolder ? "Change Folder" : "+ Add Folder"}</span>
            </button>

            {/* Apply to subfolders toggle */}
            <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-start text-left">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                <input
                  type="checkbox"
                  checked={applyToSubfolders}
                  onChange={(e) => setApplyToSubfolders(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span>Apply to all subfolders</span>
              </label>
            </div>
          </div>

          {/* Actions & Undo controls */}
          <div className="space-y-1.5">
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

          {/* Quick Undo / Redo / History */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={undo}
              disabled={!undoInfo.can_undo || isApplying}
              title="Undo last icon change"
              className="flex-1 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <Undo className="w-3.5 h-3.5" />
              <span>Undo ({undoInfo.undo_count})</span>
            </button>

            <button
              onClick={redo}
              disabled={!undoInfo.can_redo || isApplying}
              title="Redo change"
              className="flex-1 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <Redo className="w-3.5 h-3.5" />
              <span>Redo</span>
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              title="View recent update history"
              className="p-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg transition-colors flex items-center justify-center"
            >
              <History className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Visual Last Update Card */}
          {undoInfo.last_undo && (
            <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mb-1.5">
                <span className="uppercase tracking-wider">Last Update</span>
                <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                  {undoInfo.last_undo.action_type === "restore" ? "Restored" : "Applied"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                  {undoInfo.last_undo.preview_data_url ? (
                    <img
                      src={undoInfo.last_undo.preview_data_url}
                      alt="Last updated icon"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <WindowsFolderIcon color="#FDD835" className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p
                    className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate"
                    title={undoInfo.last_undo.folder_path}
                  >
                    {undoInfo.last_undo.folder_name ||
                      undoInfo.last_undo.folder_path.split(/[\\/]/).filter(Boolean).pop()}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                    {undoInfo.last_undo.recursive ? "Subfolders updated" : "Folder only"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Alert Footer */}
        {statusMessage ? (
          <div
            className={`mt-2 p-2.5 rounded-lg text-xs flex items-start gap-2 ${
              statusMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : statusMessage.type === "error"
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                : "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            }`}
          >
            {statusMessage.type === "success" && (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            )}
            {statusMessage.type === "error" && (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            {statusMessage.type === "info" && (
              <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="leading-tight">{statusMessage.text}</p>
            </div>
            <button onClick={clearStatus} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : currentFolderIcon ? (
          <div className="mt-2 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
            Active: <span className="font-mono text-zinc-700 dark:text-zinc-300">{currentFolderIcon}</span>
          </div>
        ) : null}
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 flex flex-col h-screen min-w-0 bg-white dark:bg-zinc-950">
        {/* Top Header with Responsive Segmented Navigation and Theme Toggle */}
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-3 sm:px-5 flex items-center justify-between shrink-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xs gap-2 min-w-0">
          {/* Segmented Tab Controls (Horizontally scrollable without scrollbars) */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-x-auto no-scrollbar shrink min-w-0">
            <button
              onClick={() => setCurrentTab("library")}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                currentTab === "library"
                  ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">Icon Library</span>
              <span className="md:hidden">Icons</span>
            </button>

            <button
              onClick={() => setCurrentTab("presets")}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                currentTab === "presets"
                  ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Palette className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">Color Presets</span>
              <span className="md:hidden">Colors</span>
            </button>

            <button
              onClick={() => setCurrentTab("designer")}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                currentTab === "designer"
                  ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">Icon Designer</span>
              <span className="md:hidden">Designer</span>
            </button>

            <button
              onClick={() => setCurrentTab("custom_color")}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                currentTab === "custom_color"
                  ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">Custom HSL</span>
              <span className="md:hidden">Custom</span>
            </button>

            <button
              onClick={() => setCurrentTab("import_image")}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                currentTab === "import_image"
                  ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Image className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">Import Image</span>
              <span className="md:hidden">Import</span>
            </button>
          </div>

          {/* Action Buttons: Repair + Updates + Theme */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Shell Icon Repair Button */}
            <button
              onClick={handleRepairIcons}
              disabled={isRepairing}
              title="Rebuild Windows icon cache and refresh shell"
              className="px-2 sm:px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isRepairing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span className="hidden sm:inline">Repairing...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="hidden sm:inline">Repair Icons</span>
                </>
              )}
            </button>

            <button
              onClick={() => updater.checkForUpdates(true)}
              disabled={updater.status.state === "checking" || updater.status.state === "downloading"}
              title="Check for application updates"
              className="px-2 sm:px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 disabled:opacity-50"
            >
              {updater.status.state === "checking" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  <span className="hidden sm:inline">Checking...</span>
                </>
              ) : (
                <>
                  <ArrowDownCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Updates</span>
                </>
              )}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-800"
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
                  FolderPainter v{updater.status.version} is ready
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  {updater.status.body || "New features and enhancements are ready. Update now and restart?"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={updater.downloadAndInstallUpdate}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                Update & Restart
              </button>
              <button
                onClick={updater.dismiss}
                className="px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        )}

        {updater.status.state === "downloading" && (
          <div className="mx-5 mt-3 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center gap-3 shadow-xs">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">
                <span>Downloading update... The app will restart automatically once finished.</span>
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
              <span>FolderPainter is up to date.</span>
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
            <div className="overflow-y-auto h-full pr-2">
              <IconGrid
                selectedIconPath={selectedIconPath}
                onSelectIcon={selectColorPreset}
              />
            </div>
          )}

          {currentTab === "designer" && (
            <IconDesignerTab
              onSelectDesignedIcon={(iconPath, previewUrl) => {
                selectCustomImagePath(iconPath, previewUrl);
              }}
            />
          )}

          {currentTab === "custom_color" && (
            <div className="overflow-y-auto h-full pr-2">
              <ColorWheel onSelectIcon={selectColorPreset} />
            </div>
          )}

          {currentTab === "import_image" && (
            <div className="overflow-y-auto h-full pr-2">
              <CustomIconTab onSelectIcon={selectCustomImagePath} />
            </div>
          )}
        </section>
      </main>

      {/* Visual Recent Updates History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Recent Icon Updates
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Visual history of folder customization changes.
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {undoInfo.undo_stack && undoInfo.undo_stack.length > 0 ? (
                undoInfo.undo_stack
                  .slice()
                  .reverse()
                  .map((entry, index) => (
                    <div
                      key={entry.id || `${entry.folder_path}_${index}`}
                      className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                        {entry.preview_data_url ? (
                          <img
                            src={entry.preview_data_url}
                            alt="Entry icon"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <WindowsFolderIcon color="#FDD835" className="w-6 h-6" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {entry.folder_name ||
                              entry.folder_path.split(/[\\/]/).filter(Boolean).pop()}
                          </span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                              entry.action_type === "restore"
                                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            }`}
                          >
                            {entry.action_type === "restore" ? "Restored" : "Applied"}
                          </span>
                        </div>
                        <p
                          className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5"
                          title={entry.folder_path}
                        >
                          {entry.folder_path}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[10px] text-zinc-400">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                        <button
                          onClick={async () => {
                            if (entry.id) {
                              await undoSpecificEntry(entry.id);
                            } else {
                              await undo();
                            }
                          }}
                          disabled={isApplying}
                          title={`Undo icon change for ${entry.folder_name || "this folder"}`}
                          className="px-2.5 py-1 text-[11px] font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Undo className="w-3 h-3" />
                          <span>Undo</span>
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-zinc-400 dark:text-zinc-500">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-medium">No icon updates recorded yet</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Changes you apply will appear in this history list.
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
