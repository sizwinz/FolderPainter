import React from "react";
import { Undo, Redo, Info } from "lucide-react";
import type { UndoStateInfo } from "../lib/types";

interface HistoryTabProps {
  undoInfo: UndoStateInfo;
  onUndo: () => void;
  onRedo: () => void;
  isApplying: boolean;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  undoInfo,
  onUndo,
  onRedo,
  isApplying,
}) => {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Modification History & Undo
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          FolderPainter automatically tracks folder icon changes and saves history persistently across app restarts.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
          <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Available Undos
          </div>
          <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
            {undoInfo.undo_count}
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
            Previous operations you can revert
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
          <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Available Redos
          </div>
          <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1">
            {undoInfo.redo_count}
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
            Undone operations you can restore
          </p>
        </div>
      </div>

      <div className="flex gap-2.5">
        <button
          onClick={onUndo}
          disabled={!undoInfo.can_undo || isApplying}
          className="flex-1 px-4 py-2 text-xs font-medium border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Undo className="w-4 h-4" />
          <span>Undo Previous Change</span>
        </button>

        <button
          onClick={onRedo}
          disabled={!undoInfo.can_redo || isApplying}
          className="flex-1 px-4 py-2 text-xs font-medium border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Redo className="w-4 h-4" />
          <span>Redo Last Change</span>
        </button>
      </div>

      <div className="p-3.5 rounded-lg border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-200 flex gap-2.5 items-start">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          Undo operations automatically restore the folder's original desktop.ini icon configuration and notify Windows Explorer to refresh its icon cache immediately.
        </p>
      </div>
    </div>
  );
};
