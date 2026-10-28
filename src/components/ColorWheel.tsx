import React, { useState } from "react";
import { Folder, Loader2, Sparkles } from "lucide-react";
import { generateColorIcon } from "../lib/invoke";

interface ColorWheelProps {
  onSelectIcon: (iconPath: string, hex: string) => void;
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export const ColorWheel: React.FC<ColorWheelProps> = ({ onSelectIcon }) => {
  const [hue, setHue] = useState(210);
  const [saturation, setSaturation] = useState(85);
  const [lightness, setLightness] = useState(52);
  const [isGenerating, setIsGenerating] = useState(false);

  const hexColor = hslToHex(hue, saturation, lightness);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const iconPath = await generateColorIcon(
        hue,
        saturation / 100,
        lightness / 100
      );
      onSelectIcon(iconPath, hexColor);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Custom HSL Color Engine
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Tune hue, saturation, and lightness to create any custom folder shade.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs">
        {/* Real-time preview */}
        <div className="flex flex-col items-center gap-2.5 shrink-0">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center border border-zinc-200/60 dark:border-zinc-800 shadow-inner"
            style={{ backgroundColor: `${hexColor}15` }}
          >
            <Folder
              className="w-14 h-14 transition-colors"
              style={{
                fill: hexColor,
                color: hexColor,
              }}
            />
          </div>
          <span className="text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
            {hexColor}
          </span>
        </div>

        {/* Sliders */}
        <div className="w-full space-y-4">
          {/* Hue slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                Hue
              </span>
              <span className="font-mono text-zinc-500">{hue}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={hue}
              onChange={(e) => setHue(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background:
                  "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
              }}
            />
          </div>

          {/* Saturation slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                Saturation
              </span>
              <span className="font-mono text-zinc-500">{saturation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-700"
            />
          </div>

          {/* Lightness slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                Lightness
              </span>
              <span className="font-mono text-zinc-500">{lightness}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="85"
              value={lightness}
              onChange={(e) => setLightness(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-700"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full sm:w-auto px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating Icon...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Generate & Select Custom Icon</span>
          </>
        )}
      </button>
    </div>
  );
};
