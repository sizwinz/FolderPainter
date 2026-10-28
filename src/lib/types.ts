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

export type MainTabType = "library" | "presets" | "custom_color" | "import_image" | "history";
export type TabType = MainTabType;
