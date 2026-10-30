import React, { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { generateColorIcon, listPresetColors } from "../lib/invoke";
import type { PresetColor } from "../lib/types";

interface IconGridProps {
  selectedIconPath: string | null;
  onSelectIcon: (iconPath: string, previewUrl: string, hex: string) => void;
}

export function WindowsFolderIcon({
  color,
  className = "w-7 h-7",
}: {
  color: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Back tab and body */}
      <path
        d="M 20 44 C 20 38, 26 34, 34 34 L 102 34 C 108 34, 114 38, 118 44 L 126 58 L 228 58 C 235 58, 240 63, 240 70 L 240 206 C 240 214, 234 220, 226 220 L 20 220 Z"
        fill={color}
        fillOpacity="0.88"
      />
      {/* Front Folder Flap (Solid Windows 11 silhouette matching FolderIco) */}
      <rect
        x="16"
        y="62"
        width="224"
        height="148"
        rx="16"
        ry="16"
        fill={color}
      />
      {/* Front flap specular highlight */}
      <rect
        x="18"
        y="62"
        width="220"
        height="2"
        rx="1"
        fill="#FFFFFF"
        fillOpacity="0.35"
      />
      {/* Subtle depth gradient */}
      <rect
        x="16"
        y="62"
        width="224"
        height="148"
        rx="16"
        ry="16"
        fill="#000000"
        fillOpacity="0.04"
      />
    </svg>
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
