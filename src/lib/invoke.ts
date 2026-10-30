import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type {
  CatalogResponse,
  CollectionsResponse,
  ConvertedIconResult,
  DesignOptions,
  DesignedIconResult,
  FolderIconPreview,
  GeneratedIconResult,
  PresetColor,
  UndoEntry,
  UndoStateInfo,
} from "./types";

export async function selectFolderDialog(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: "Select Folder to Customize",
  });
  if (typeof selected === "string") {
    return selected;
  }
  return null;
}

export async function selectImageDialog(): Promise<string | null> {
  const selected = await open({
    directory: false,
    multiple: false,
    title: "Select Image to Convert into Icon",
    filters: [
      {
        name: "Supported Images",
        extensions: ["png", "jpg", "jpeg", "bmp", "webp", "ico"],
      },
    ],
  });
  if (typeof selected === "string") {
    return selected;
  }
  return null;
}

export async function listPresetColors(): Promise<PresetColor[]> {
  return await invoke<PresetColor[]>("list_preset_colors");
}

export async function getDefaultFolderPreview(): Promise<string> {
  return await invoke<string>("get_default_folder_preview");
}

export async function generateColorIcon(
  hue: number,
  saturation: number,
  lightness: number
): Promise<GeneratedIconResult> {
  return await invoke<GeneratedIconResult>("generate_color_icon", {
    hue,
    saturation,
    lightness,
  });
}

export async function generateDesignedIcon(
  options: DesignOptions
): Promise<DesignedIconResult> {
  return await invoke<DesignedIconResult>("generate_designed_icon", {
    options,
  });
}

export async function convertImageToIcon(imagePath: string): Promise<ConvertedIconResult> {
  return await invoke<ConvertedIconResult>("convert_image_to_icon", {
    imagePath,
  });
}

export async function getIconPreviewDataUrl(iconPath: string): Promise<string> {
  return await invoke<string>("get_icon_preview_data_url", {
    iconPath,
  });
}

export async function fetchCollections(): Promise<CollectionsResponse> {
  return await invoke<CollectionsResponse>("fetch_collections");
}

export async function fetchIcons(
  offset: number,
  limit: number,
  query?: string
): Promise<CatalogResponse> {
  return await invoke<CatalogResponse>("fetch_icons", {
    offset,
    limit,
    query: query || null,
  });
}

export async function downloadAndConvertIcon(url: string): Promise<string> {
  return await invoke<string>("download_and_convert_icon", {
    url,
  });
}

export async function clearIconCache(): Promise<void> {
  await invoke("clear_icon_cache");
}

export async function repairIconCache(): Promise<string> {
  return await invoke<string>("repair_icon_cache");
}

export async function applyIcon(
  folderPath: string,
  iconPath: string,
  recursive?: boolean
): Promise<number> {
  return await invoke<number>("apply_icon_tracked", {
    folderPath,
    iconPath,
    recursive: recursive ?? false,
  });
}

export async function restoreIcon(
  folderPath: string,
  recursive?: boolean
): Promise<number> {
  return await invoke<number>("restore_icon_tracked", {
    folderPath,
    recursive: recursive ?? false,
  });
}

export async function getCurrentIcon(
  folderPath: string
): Promise<string | null> {
  return await invoke<string | null>("get_current_icon", {
    folderPath,
  });
}

export async function getFolderCurrentIconPreview(
  folderPath: string
): Promise<FolderIconPreview> {
  return await invoke<FolderIconPreview>("get_folder_current_icon_preview", {
    folderPath,
  });
}

export async function undoLast(): Promise<UndoEntry | null> {
  return await invoke<UndoEntry | null>("undo_last");
}

export async function undoSpecific(entryId: string): Promise<UndoEntry | null> {
  return await invoke<UndoEntry | null>("undo_specific", {
    entryId,
  });
}

export async function redoLast(): Promise<UndoEntry | null> {
  return await invoke<UndoEntry | null>("redo_last");
}

export async function getUndoState(): Promise<UndoStateInfo> {
  return await invoke<UndoStateInfo>("get_undo_state");
}

export async function setWindowTheme(theme: "dark" | "light"): Promise<void> {
  try {
    await invoke("set_window_theme", { theme });
  } catch (err) {
    console.warn("Failed to set window theme:", err);
  }
}
