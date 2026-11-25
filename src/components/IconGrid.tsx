import React, { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { generateColorIcon, listPresetColors } from "../lib/invoke";
import type { PresetColor } from "../lib/types";

interface IconGridProps {
  selectedIconPath: string | null;
  onSelectIcon: (iconPath: string, previewUrl: string, hex: string) => void;
  onSyncHsl?: (hsl: { hue: number; saturation: number; lightness: number }) => void;
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
  default: defaultFolderPng,
  "#ffda73": defaultFolderPng,
  "#ffca28": defaultFolderPng,
  "#fdd835": defaultFolderPng,
  yellow: yellowFolderPng,
  "#f7f700": yellowFolderPng,
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

function hexToFilter(hex?: string): string | undefined {
  if (!hex) return undefined;
  const clean = hex.trim().replace(/^#/, "");
  if (clean.length !== 6 && clean.length !== 3) return undefined;

  const r = parseInt(clean.length === 3 ? clean[0] + clean[0] : clean.slice(0, 2), 16);
  const g = parseInt(clean.length === 3 ? clean[1] + clean[1] : clean.slice(2, 4), 16);
  const b = parseInt(clean.length === 3 ? clean[2] + clean[2] : clean.slice(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return undefined;

  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) {
    return `grayscale(1) brightness(${Math.round((l / 0.725) * 100)}%)`;
  }

  const s = l <= 0.5 ? delta / (max + min) : delta / (2 - max - min);
  let h = 0;
  if (max === rf) {
    h = 60 * (((gf - bf) / delta) + (gf < bf ? 6 : 0));
  } else if (max === gf) {
    h = 60 * (((bf - rf) / delta) + 2);
  } else {
    h = 60 * (((rf - gf) / delta) + 4);
  }

  const hueRotate = Math.round(h - 44);
  const saturate = Math.round((s / 0.98) * 100);
  const brightness = Math.round((l / 0.725) * 100);

  return `hue-rotate(${hueRotate}deg) saturate(${saturate}%) brightness(${brightness}%)`;
}

export function WindowsFolderIcon({
  color,
  className = "w-7 h-7",
}: {
  color?: string;
  className?: string;
}) {
  const key = color?.toLowerCase().trim() || "default";
  const hasPreset = key in FOLDER_COLOR_MAP;
  const iconSrc = hasPreset ? FOLDER_COLOR_MAP[key] : defaultFolderPng;
  const filterStyle = !hasPreset && color?.startsWith("#") ? hexToFilter(color) : undefined;

  return (
    <img
      src={iconSrc}
      alt="Windows Folder"
      style={filterStyle ? { filter: filterStyle } : undefined}
      className={`${className} object-contain select-none`}
      draggable={false}
    />
  );
}

export const IconGrid: React.FC<IconGridProps> = ({
  selectedIconPath,
  onSelectIcon,
  onSyncHsl,
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
    onSyncHsl?.({
      hue: preset.hue,
      saturation: preset.saturation,
      lightness: preset.lightness,
    });
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
          Select a classic Windows folder preset or fine-tune any shade with the HSL sliders below.
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
