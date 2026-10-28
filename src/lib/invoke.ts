import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { PresetColor, UndoEntry, UndoStateInfo } from "./types";

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

export async function generateColorIcon(
  hue: number,
  saturation: number,
  lightness: number
): Promise<string> {
  return await invoke<string>("generate_color_icon", {
    hue,
    saturation,
    lightness,
  });
}

export async function convertImageToIcon(imagePath: string): Promise<string> {
  return await invoke<string>("convert_image_to_icon", {
    imagePath,
  });
}

export async function applyIcon(
  folderPath: string,
  iconPath: string
): Promise<void> {
  await invoke("apply_icon_tracked", {
    folderPath,
    iconPath,
  });
}

export async function restoreIcon(folderPath: string): Promise<void> {
  await invoke("restore_icon_tracked", {
    folderPath,
  });
}

export async function getCurrentIcon(
  folderPath: string
): Promise<string | null> {
  return await invoke<string | null>("get_current_icon", {
    folderPath,
  });
}

export async function undoLast(): Promise<UndoEntry | null> {
  return await invoke<UndoEntry | null>("undo_last");
}

export async function redoLast(): Promise<UndoEntry | null> {
  return await invoke<UndoEntry | null>("redo_last");
}

export async function getUndoState(): Promise<UndoStateInfo> {
  return await invoke<UndoStateInfo>("get_undo_state");
}
