import React, { useState } from "react";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { convertImageToIcon, selectImageDialog } from "../lib/invoke";

interface CustomIconTabProps {
  onSelectIcon: (iconPath: string) => void;
}

export const CustomIconTab: React.FC<CustomIconTabProps> = ({ onSelectIcon }) => {
  const [isConverting, setIsConverting] = useState(false);
  const [convertedPath, setConvertedPath] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = async (filePath: string) => {
    setIsConverting(true);
    try {
      const icoPath = await convertImageToIcon(filePath);
      setConvertedPath(icoPath);
      onSelectIcon(icoPath);
    } catch (err) {
      console.error(err);
    } finally {
      setIsConverting(false);
    }
  };

  const handleBrowse = async () => {
    const file = await selectImageDialog();
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const path = (file as unknown as { path?: string }).path;
      if (path) {
        await processFile(path);
      }
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Import Custom Image
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Convert any PNG, JPG, BMP, or WebP picture directly into a multi-resolution Windows folder icon.
        </p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowse}
        className={`p-8 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          isDragOver
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900/40"
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 mb-3">
          {isConverting ? (
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>

        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
          {isConverting ? "Converting image to Windows icon..." : "Drop image here or click to browse"}
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
          Supports transparent PNG, JPG, BMP, WebP (256x256 recommended)
        </p>
      </div>

      {convertedPath && (
        <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2 truncate">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate font-medium">{convertedPath}</span>
          </div>
          <span className="shrink-0 font-semibold text-[10px] uppercase tracking-wider bg-emerald-200/60 dark:bg-emerald-800/40 px-2 py-0.5 rounded">
            Selected
          </span>
        </div>
      )}
    </div>
  );
};
