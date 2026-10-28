import React from "react";
import { Check, RotateCcw, Undo, Redo, Loader2, AlertCircle, CheckCircle2, Info, Folder } from "lucide-react";
import type { StatusMessage } from "../hooks/useFolderIcon";
import type { UndoStateInfo } from "../lib/types";

interface ActionBarProps {
  selectedFolder: string | null;
  selectedIconPath: string | null;
  previewColorHex: string | null;
  isApplying: boolean;
  statusMessage: StatusMessage | null;
  undoInfo: UndoStateInfo;
  onApply: () => void;
  onRestore: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDismissStatus: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  selectedFolder,
  selectedIconPath,
  previewColorHex,
  isApplying,
  statusMessage,
  undoInfo,
  onApply,
  onRestore,
  onUndo,
  onRedo,
  onDismissStatus,
}) => {
  const canApply = Boolean(selectedFolder && selectedIconPath && !isApplying);
  const canRestore = Boolean(selectedFolder && !isApplying);

  return (
    <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3 select-none">
      {/* Status banner */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between p-2.5 rounded-lg text-xs transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : statusMessage.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              : "bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
            {statusMessage.type === "error" && <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            {statusMessage.type === "info" && <Info className="w-4 h-4 shrink-0 text-blue-600" />}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button
            onClick={onDismissStatus}
            className="text-[10px] font-semibold uppercase tracking-wider opacity-60 hover:opacity-100 px-1.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Selected preview pill */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shrink-0"
            style={{ backgroundColor: previewColorHex ? `${previewColorHex}20` : undefined }}
          >
            <Folder
              className="w-3.5 h-3.5"
              style={{
                fill: previewColorHex || "#9ca3af",
                color: previewColorHex || "#9ca3af",
              }}
            />
          </div>
          <span className="truncate max-w-xs font-medium text-zinc-700 dark:text-zinc-300">
            {selectedIconPath ? "Icon Ready" : "No icon selected"}
          </span>
        </div>

        {/* Action button group */}
        <div className="flex items-center gap-2">
          {/* Quick undo/redo */}
          <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-900">
            <button
              onClick={onUndo}
              disabled={!undoInfo.can_undo || isApplying}
              title="Undo last icon change"
              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800" />
            <button
              onClick={onRedo}
              disabled={!undoInfo.can_redo || isApplying}
              title="Redo last change"
              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Restore default button */}
          <button
            onClick={onRestore}
            disabled={!canRestore}
            className="px-3 py-2 text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Default</span>
          </button>

          {/* Apply button */}
          <button
            onClick={onApply}
            disabled={!canApply}
            className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-xs shadow-blue-500/20"
          >
            {isApplying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>Apply to Folder</span>
          </button>
        </div>
      </div>
    </div>
  );
};
