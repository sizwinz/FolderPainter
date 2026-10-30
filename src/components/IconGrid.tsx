import React, { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { generateColorIcon, listPresetColors } from "../lib/invoke";
import type { PresetColor } from "../lib/types";

interface IconGridProps {
  selectedIconPath: string | null;
  onSelectIcon: (iconPath: string, previewUrl: string, hex: string) => void;
}

import defaultFolderPng from "../assets/windows_default_folder.png";
import azureFolderPng from "../assets/windows11_folders/azure.png";
import blackFolderPng from "../assets/windows11_folders/black.png";
import blueFolderPng from "../assets/windows11_folders/blue.png";
import brownFolderPng from "../assets/windows11_folders/brown.png";
import grayFolderPng from "../assets/windows11_folders/gray.png";
import greenFolderPng from "../assets/windows11_folders/green.png";
import lemonFolderPng from "../assets/windows11_folders/lemon.png";
import orangeFolderPng from "../assets/windows11_folders/orange.png";
import pinkFolderPng from "../assets/windows11_folders/pink.png";
import redFolderPng from "../assets/windows11_folders/red.png";
import violetFolderPng from "../assets/windows11_folders/violet.png";
import whiteFolderPng from "../assets/windows11_folders/white.png";
import yellowFolderPng from "../assets/windows11_folders/yellow.png";

const FOLDER_COLOR_MAP: Record<string, string> = {
  yellow: yellowFolderPng,
  "#fdd835": yellowFolderPng,
  "#ffe169": yellowFolderPng,
  azure: azureFolderPng,
  "#039be5": azureFolderPng,
  "#0288d1": azureFolderPng,
  black: blackFolderPng,
  "#212121": blackFolderPng,
  "#374151": blackFolderPng,
  blue: blueFolderPng,
  "#1e88e5": blueFolderPng,
  "#1565c0": blueFolderPng,
  "#3949ab": blueFolderPng,
  brown: brownFolderPng,
  "#6d4c41": brownFolderPng,
  gray: grayFolderPng,
  "#546e7a": grayFolderPng,
  "#64748b": grayFolderPng,
  green: greenFolderPng,
  "#43a047": greenFolderPng,
  "#2e7d32": greenFolderPng,
  "#00897b": greenFolderPng,
  lemon: lemonFolderPng,
  "#7cb342": lemonFolderPng,
  orange: orangeFolderPng,
  "#fb8c00": orangeFolderPng,
  "#ef6c00": orangeFolderPng,
  pink: pinkFolderPng,
  "#d81b60": pinkFolderPng,
  "#ad1457": pinkFolderPng,
  red: redFolderPng,
  "#e53935": redFolderPng,
  "#c62828": redFolderPng,
  violet: violetFolderPng,
  "#8e24aa": violetFolderPng,
  "#6a1b9a": violetFolderPng,
  white: whiteFolderPng,
  "#e2e8f0": whiteFolderPng,
};

export function WindowsFolderIcon({
  color,
  className = "w-7 h-7",
}: {
  color?: string;
  className?: string;
}) {
  const key = color?.toLowerCase().trim() || "yellow";
  const iconSrc = FOLDER_COLOR_MAP[key] || defaultFolderPng;

  return (
    <img
      src={iconSrc}
      alt="Windows Folder"
      className={`${className} object-contain select-none`}
      draggable={false}
    />
  );
}

export const IconGrid: React.FC<IconGridProps> = ({
  selectedIconPath,
  onSelectIcon,
}) => {
  const [presets, setPresets] = useState<PresetColor[]>([]);
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);

  useEffect(() => {
    listPresetColors()
      .then(setPresets)
      .catch(() => {});
  }, []);

  const handleSelectPreset = async (preset: PresetColor) => {
    setLoadingPreset(preset.hex);
    try {
      const result = await generateColorIcon(
        preset.hue,
        preset.saturation,
        preset.lightness
      );
      onSelectIcon(result.icon_path, result.preview_data_url, preset.hex);
    } finally {
      setLoadingPreset(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Color Presets
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Select a classic Windows-styled folder color to apply instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {presets.map((preset) => {
          const isLoading = loadingPreset === preset.hex;
          const isSelected =
            selectedIconPath !== null &&
            selectedIconPath.includes(
              `h${Math.round(preset.hue * 10)}_s${Math.round(
                preset.saturation * 100
              )}_l${Math.round(preset.lightness * 100)}`
            );

          return (
            <button
              key={preset.hex}
              onClick={() => handleSelectPreset(preset)}
              disabled={isLoading}
              className={`group relative flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? "border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-600 dark:ring-blue-500"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}
            >
              <div
                className="w-10 h-10 shrink-0 rounded-md flex items-center justify-center shadow-xs transition-transform group-hover:scale-105"
                style={{ backgroundColor: `${preset.hex}15` }}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                ) : (
                  <WindowsFolderIcon color={preset.hex} className="w-7 h-7 drop-shadow-xs" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {preset.name}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                  {preset.hex}
                </div>
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
