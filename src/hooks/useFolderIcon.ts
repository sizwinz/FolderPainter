import { useEffect, useState } from "react";
import {
  applyIcon,
  downloadAndConvertIcon,
  getDefaultFolderPreview,
  getFolderCurrentIconPreview,
  getUndoState,
  redoLast,
  restoreIcon,
  undoLast,
  undoSpecific,
} from "../lib/invoke";
import type { UndoStateInfo } from "../lib/types";

export interface StatusMessage {
  text: string;
  type: "success" | "error" | "info";
}

export function useFolderIcon() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [currentFolderIcon, setCurrentFolderIcon] = useState<string | null>(null);
  const [folderCurrentPreviewUrl, setFolderCurrentPreviewUrl] = useState<string | null>(null);
  const [showingFolderCurrentIcon, setShowingFolderCurrentIcon] = useState<boolean>(false);
  const [selectedIconPath, setSelectedIconPath] = useState<string | null>(null);
  const [previewColorHex, setPreviewColorHex] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [applyToSubfolders, setApplyToSubfolders] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isPreparingIcon, setIsPreparingIcon] = useState(false);
  const [undoInfo, setUndoInfo] = useState<UndoStateInfo>({
    can_undo: false,
    can_redo: false,
    undo_count: 0,
    redo_count: 0,
    last_undo: null,
    last_redo: null,
    undo_stack: [],
    redo_stack: [],
  });
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  const refreshUndoState = async () => {
    try {
      const state = await getUndoState();
      setUndoInfo(state);
    } catch {
      // Ignored
    }
  };

  const loadFolderIcon = async (folder: string, setAsActivePreview = true) => {
    try {
      const preview = await getFolderCurrentIconPreview(folder);
      setCurrentFolderIcon(preview.icon_path);
      setFolderCurrentPreviewUrl(preview.preview_data_url);
      if (setAsActivePreview) {
        setPreviewImageUrl(preview.preview_data_url);
        setPreviewColorHex(null);
        setSelectedIconPath(null);
        setShowingFolderCurrentIcon(true);
      }
      return preview;
    } catch {
      setCurrentFolderIcon(null);
      setFolderCurrentPreviewUrl(null);
      return null;
    }
  };

  useEffect(() => {
    refreshUndoState();
    getDefaultFolderPreview()
      .then((url) => {
        setPreviewImageUrl((prev) => prev || url);
      })
      .catch(() => {});
  }, []);

  const selectFolder = async (folder: string) => {
    setStatusMessage(null);
    if (!folder) {
      setSelectedFolder(null);
      setCurrentFolderIcon(null);
      setFolderCurrentPreviewUrl(null);
      setSelectedIconPath(null);
      setPreviewColorHex(null);
      setShowingFolderCurrentIcon(false);
      const defaultPreview = await getDefaultFolderPreview().catch(() => null);
      if (defaultPreview) {
        setPreviewImageUrl(defaultPreview);
      }
      return;
    }

    setSelectedFolder(folder);
    await loadFolderIcon(folder, true);
  };

  const selectColorPreset = (iconPath: string, previewUrl: string, colorHex?: string) => {
    setSelectedIconPath(iconPath);
    setPreviewImageUrl(previewUrl);
    setPreviewColorHex(colorHex || null);
    setShowingFolderCurrentIcon(false);
  };

  const selectRemoteIcon = async (assetUrl: string) => {
    setPreviewImageUrl(assetUrl);
    setPreviewColorHex(null);
    setShowingFolderCurrentIcon(false);
    setIsPreparingIcon(true);

    try {
      const localIcoPath = await downloadAndConvertIcon(assetUrl);
      setSelectedIconPath(localIcoPath);
    } catch (err: unknown) {
      setStatusMessage({
        text: typeof err === "string" ? err : "Failed to prepare icon asset.",
        type: "error",
      });
    } finally {
      setIsPreparingIcon(false);
    }
  };

  const selectCustomImagePath = (iconPath: string, previewUrl: string) => {
    setSelectedIconPath(iconPath);
    setPreviewImageUrl(previewUrl);
    setPreviewColorHex(null);
    setShowingFolderCurrentIcon(false);
  };

  const apply = async () => {
    if (!selectedFolder) {
      setStatusMessage({ text: "Select a target folder first.", type: "error" });
      return;
    }
    if (!selectedIconPath) {
      setStatusMessage({ text: "Select an icon or color first.", type: "error" });
      return;
    }

    setIsApplying(true);
    setStatusMessage(null);

    try {
      const count = await applyIcon(selectedFolder, selectedIconPath, applyToSubfolders);
      await loadFolderIcon(selectedFolder, true);
      await refreshUndoState();
      setStatusMessage({
        text:
          count > 1
            ? `Applied custom icon to ${count} folders.`
            : "Custom icon applied successfully to folder.",
        type: "success",
      });
    } catch (err: unknown) {
      setStatusMessage({
        text: typeof err === "string" ? err : "Failed to apply icon.",
        type: "error",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const restore = async () => {
    if (!selectedFolder) {
      setStatusMessage({ text: "Select a target folder first.", type: "error" });
      return;
    }

    setIsApplying(true);
    setStatusMessage(null);

    try {
      const count = await restoreIcon(selectedFolder, applyToSubfolders);
      await loadFolderIcon(selectedFolder, true);
      await refreshUndoState();
      setStatusMessage({
        text:
          count > 1
            ? `Default icon restored for ${count} folders.`
            : "Default folder icon restored successfully.",
        type: "success",
      });
    } catch (err: unknown) {
      setStatusMessage({
        text: typeof err === "string" ? err : "Failed to restore default icon.",
        type: "error",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const undo = async () => {
    setIsApplying(true);
    setStatusMessage(null);

    try {
      const entry = await undoLast();
      if (entry) {
        setSelectedFolder(entry.folder_path);
        await loadFolderIcon(entry.folder_path, true);
        await refreshUndoState();

        const folderName = entry.folder_name || entry.folder_path.split(/[\\/]/).pop() || entry.folder_path;
        setStatusMessage({
          text: `Reverted icon change for "${folderName}".${entry.recursive ? " (Subfolders included)" : ""}`,
          type: "info",
        });
      }
    } catch (err: unknown) {
      setStatusMessage({
        text: typeof err === "string" ? err : "Failed to undo action.",
        type: "error",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const redo = async () => {
    setIsApplying(true);
    setStatusMessage(null);

    try {
      const entry = await redoLast();
      if (entry) {
        setSelectedFolder(entry.folder_path);
        await loadFolderIcon(entry.folder_path, true);
        await refreshUndoState();

        const folderName = entry.folder_name || entry.folder_path.split(/[\\/]/).pop() || entry.folder_path;
        setStatusMessage({
          text: `Redid icon change for "${folderName}".${entry.recursive ? " (Subfolders included)" : ""}`,
          type: "info",
        });
      }
    } catch (err: unknown) {
      setStatusMessage({
        text: typeof err === "string" ? err : "Failed to redo action.",
        type: "error",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const undoSpecificEntry = async (entryId: string) => {
    setIsApplying(true);
    setStatusMessage(null);

    try {
      const entry = await undoSpecific(entryId);
      if (entry) {
        if (selectedFolder && selectedFolder.toLowerCase() === entry.folder_path.toLowerCase()) {
          await loadFolderIcon(entry.folder_path, true);
        }
        await refreshUndoState();

        const folderName = entry.folder_name || entry.folder_path.split(/[\\/]/).pop() || entry.folder_path;
        setStatusMessage({
          text: `Reverted icon change for "${folderName}".${entry.recursive ? " (Subfolders included)" : ""}`,
          type: "info",
        });
        return entry;
      }
    } catch (err: unknown) {
      setStatusMessage({
        text: typeof err === "string" ? err : "Failed to undo action.",
        type: "error",
      });
    } finally {
      setIsApplying(false);
    }
    return null;
  };

  return {
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
    showStatus: (msg: StatusMessage) => setStatusMessage(msg),
    clearStatus: () => setStatusMessage(null),
    refreshUndoState,
  };
}
