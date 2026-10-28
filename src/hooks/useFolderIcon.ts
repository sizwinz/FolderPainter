import { useEffect, useState } from "react";
import {
  applyIcon,
  downloadAndConvertIcon,
  getCurrentIcon,
  getDefaultFolderPreview,
  getUndoState,
  redoLast,
  restoreIcon,
  undoLast,
} from "../lib/invoke";
import type { UndoStateInfo } from "../lib/types";

export interface StatusMessage {
  text: string;
  type: "success" | "error" | "info";
}

export function useFolderIcon() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [currentFolderIcon, setCurrentFolderIcon] = useState<string | null>(null);
  const [selectedIconPath, setSelectedIconPath] = useState<string | null>(null);
  const [previewColorHex, setPreviewColorHex] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isPreparingIcon, setIsPreparingIcon] = useState(false);
  const [undoInfo, setUndoInfo] = useState<UndoStateInfo>({
    can_undo: false,
    can_redo: false,
    undo_count: 0,
    redo_count: 0,
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

  const refreshFolderIcon = async (folder: string) => {
    try {
      const icon = await getCurrentIcon(folder);
      setCurrentFolderIcon(icon);
    } catch {
      setCurrentFolderIcon(null);
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

  useEffect(() => {
    if (selectedFolder) {
      refreshFolderIcon(selectedFolder);
    } else {
      setCurrentFolderIcon(null);
    }
  }, [selectedFolder]);

  const selectFolder = (folder: string) => {
    setSelectedFolder(folder);
    setStatusMessage(null);
  };

  const selectColorPreset = (iconPath: string, previewUrl: string, colorHex?: string) => {
    setSelectedIconPath(iconPath);
    setPreviewImageUrl(previewUrl);
    setPreviewColorHex(colorHex || null);
  };

  const selectRemoteIcon = async (assetUrl: string) => {
    setPreviewImageUrl(assetUrl);
    setPreviewColorHex(null);
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
      await applyIcon(selectedFolder, selectedIconPath);
      await refreshFolderIcon(selectedFolder);
      await refreshUndoState();
      setStatusMessage({
        text: "Custom icon applied successfully to folder.",
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
      await restoreIcon(selectedFolder);
      await refreshFolderIcon(selectedFolder);
      await refreshUndoState();
      setStatusMessage({
        text: "Default folder icon restored successfully.",
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
        if (selectedFolder && selectedFolder === entry.folder_path) {
          await refreshFolderIcon(selectedFolder);
        }
        await refreshUndoState();
        setStatusMessage({
          text: `Undid last icon change for ${entry.folder_path}`,
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
        if (selectedFolder && selectedFolder === entry.folder_path) {
          await refreshFolderIcon(selectedFolder);
        }
        await refreshUndoState();
        setStatusMessage({
          text: `Redid icon change for ${entry.folder_path}`,
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

  return {
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
    clearStatus: () => setStatusMessage(null),
  };
}
