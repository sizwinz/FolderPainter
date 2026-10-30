export interface PresetColor {
  name: string;
  hex: string;
  hue: number;
  saturation: number;
  lightness: number;
}

export interface GeneratedIconResult {
  icon_path: string;
  preview_data_url: string;
}

export interface ConvertedIconResult {
  icon_path: string;
  preview_data_url: string;
}

export interface FolderIconPreview {
  has_custom_icon: boolean;
  icon_path: string | null;
  preview_data_url: string;
}

export interface UndoEntry {
  id?: string;
  folder_path: string;
  folder_name?: string;
  previous_icon: string | null;
  new_icon: string | null;
  action_type?: string;
  recursive?: boolean;
  timestamp?: number;
  preview_data_url?: string | null;
}

export interface UndoStateInfo {
  can_undo: boolean;
  can_redo: boolean;
  undo_count: number;
  redo_count: number;
  last_undo?: UndoEntry | null;
  last_redo?: UndoEntry | null;
  undo_stack?: UndoEntry[];
  redo_stack?: UndoEntry[];
}

export interface CollectionAuthor {
  name: string;
  url?: string;
}

export interface CollectionItem {
  id: string;
  title: string;
  author?: CollectionAuthor;
}

export interface CollectionsResponse {
  total: number;
  collections: CollectionItem[];
}

export interface IconAsset {
  size: number;
  url: string;
}

export interface IconItem {
  id: string;
  name: string;
  collectionId: string;
  library?: string;
  tags?: string[];
  assets: IconAsset[];
}

export interface CatalogResponse {
  offset: number;
  limit: number;
  total: number;
  collections?: CollectionItem[];
  items: IconItem[];
}

export interface DesignedIconResult {
  icon_path: string;
  preview_data_url: string;
}

export interface DesignOptions {
  hue: number;
  saturation: number;
  lightness: number;
  custom_cover_path?: string | null;
  custom_cover_data_url?: string | null;
  cover_fit_mode?: "cover" | "contain" | "custom" | null;
  cover_scale?: number | null;
  cover_offset_x?: number | null;
  cover_offset_y?: number | null;
  sticker_path?: string | null;
  sticker_data_url?: string | null;
  sticker_scale: number;
  sticker_offset_x: number;
  sticker_offset_y: number;
  sticker_opacity: number;
  sticker_tint_hex?: string | null;
}

export type MainTabType = "library" | "presets" | "designer" | "custom_color" | "import_image";
export type TabType = MainTabType;
