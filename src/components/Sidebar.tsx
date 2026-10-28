import React from "react";
import { Palette, Sliders, Image, History, Sun, Moon, Folder } from "lucide-react";
import type { TabType } from "../lib/types";
import type { Theme } from "../hooks/useTheme";

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  theme: Theme;
  onToggleTheme: () => void;
  undoCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  theme,
  onToggleTheme,
  undoCount,
}) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "presets", label: "Presets", icon: <Palette className="w-4 h-4" /> },
    { id: "custom_color", label: "Custom Color", icon: <Sliders className="w-4 h-4" /> },
    { id: "import_image", label: "Import Image", icon: <Image className="w-4 h-4" /> },
    { id: "history", label: "History", icon: <History className="w-4 h-4" />, badge: undoCount > 0 ? undoCount : undefined },
  ];

  return (
    <aside className="w-56 shrink-0 h-screen flex flex-col justify-between border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 select-none">
      <div className="space-y-6">
        {/* Brand header */}
        <div className="flex items-center gap-2.5 px-2 pt-1">
          <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Folder className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              FolderPainter
            </h1>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
              Open Source v0.1
            </p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  active
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200/80 dark:border-zinc-700/80"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={active ? "text-blue-600 dark:text-blue-400" : ""}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Theme toggle and footer info */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md transition-colors"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <span className="flex items-center gap-2.5">
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-500" />}
            <span>Theme</span>
          </span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
            {theme}
          </span>
        </button>
      </div>
    </aside>
  );
};
