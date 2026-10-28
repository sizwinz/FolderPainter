import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { FolderPicker } from "./components/FolderPicker";
import { IconGrid } from "./components/IconGrid";
import { ColorWheel } from "./components/ColorWheel";
import { CustomIconTab } from "./components/CustomIconTab";
import { HistoryTab } from "./components/HistoryTab";
import { ActionBar } from "./components/ActionBar";
import { useTheme } from "./hooks/useTheme";
import { useFolderIcon } from "./hooks/useFolderIcon";
import type { TabType } from "./lib/types";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [currentTab, setCurrentTab] = useState<TabType>("presets");

  const {
    selectedFolder,
    currentFolderIcon,
    selectedIconPath,
    previewColorHex,
    isApplying,
    undoInfo,
    statusMessage,
    selectFolder,
    selectIcon,
    apply,
    restore,
    undo,
    redo,
    clearStatus,
  } = useFolderIcon();

  return (
    <div className="flex h-screen w-screen bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 antialiased overflow-hidden select-none">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        undoCount={undoInfo.undo_count}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col h-screen min-w-0 bg-white dark:bg-zinc-950">
        {/* Top Target Folder Bar */}
        <header className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
          <FolderPicker
            selectedFolder={selectedFolder}
            currentFolderIcon={currentFolderIcon}
            onSelectFolder={selectFolder}
            onClearFolder={() => selectFolder("")}
          />
        </header>

        {/* Scrollable Tab Content */}
        <section className="flex-1 overflow-y-auto p-6">
          {currentTab === "presets" && (
            <IconGrid
              selectedIconPath={selectedIconPath}
              onSelectIcon={selectIcon}
            />
          )}

          {currentTab === "custom_color" && (
            <ColorWheel onSelectIcon={selectIcon} />
          )}

          {currentTab === "import_image" && (
            <CustomIconTab onSelectIcon={(path) => selectIcon(path)} />
          )}

          {currentTab === "history" && (
            <HistoryTab
              undoInfo={undoInfo}
              onUndo={undo}
              onRedo={redo}
              isApplying={isApplying}
            />
          )}
        </section>

        {/* Bottom Persistent Action Bar */}
        <ActionBar
          selectedFolder={selectedFolder}
          selectedIconPath={selectedIconPath}
          previewColorHex={previewColorHex}
          isApplying={isApplying}
          statusMessage={statusMessage}
          undoInfo={undoInfo}
          onApply={apply}
          onRestore={restore}
          onUndo={undo}
          onRedo={redo}
          onDismissStatus={clearStatus}
        />
      </main>
    </div>
  );
}
