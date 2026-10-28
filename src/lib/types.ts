export interface PresetColor {
  name: String;
  hex: string;
  hue: number;
  saturation: number;
  lightness: number;
}

export interface UndoEntry {
  folder_path: string;
  previous_icon: string | null;
  new_icon: string | null;
}

export interface UndoStateInfo {
  can_undo: boolean;
  can_redo: boolean;
  undo_count: number;
  redo_count: number;
}

export type TabType = "presets" | "custom_color" | "import_image" | "history";
