import React, { useState } from "react";
import { Folder, FolderOpen, CheckCircle2, X } from "lucide-react";
import { selectFolderDialog } from "../lib/invoke";

interface FolderPickerProps {
  selectedFolder: string | null;
  currentFolderIcon: string | null;
  onSelectFolder: (path: string) => void;
  onClearFolder: () => void;
}

export const FolderPicker: React.FC<FolderPickerProps> = ({
  selectedFolder,
  currentFolderIcon,
  onSelectFolder,
  onClearFolder,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleBrowse = async () => {
    const path = await selectFolderDialog();
    if (path) {
      onSelectFolder(path);
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
      // On desktop webview, files may contain native path
      const path = (file as unknown as { path?: string }).path;
      if (path) {
        onSelectFolder(path);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative p-3.5 rounded-lg border transition-all ${
        isDragOver
          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
            {selectedFolder ? (
              <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <Folder className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Target Folder
              </span>
              {currentFolderIcon && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Custom Icon Active
                </span>
              )}
            </div>
            <div
              className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-md"
              title={selectedFolder || "No folder selected"}
            >
              {selectedFolder || "Drag and drop a folder here or click Browse"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedFolder && (
            <button
              onClick={onClearFolder}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Clear selected folder"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleBrowse}
            className="px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Browse</span>
          </button>
        </div>
      </div>
    </div>
  );
};
