import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Search, Globe, Loader2, Layers, RotateCcw, Database } from "lucide-react";
import { fetchCollections, fetchIcons, clearIconCache } from "../lib/invoke";
import { CachedIconImage } from "./CachedIconImage";
import type { CollectionItem, IconItem } from "../lib/types";

interface IconLibraryTabProps {
  selectedImageUrl: string | null;
  onSelectIcon: (assetUrl: string, name: string) => void;
}

export const IconLibraryTab: React.FC<IconLibraryTabProps> = ({
  selectedImageUrl,
  onSelectIcon,
}) => {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState<IconItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load collections list
  useEffect(() => {
    fetchCollections()
      .then((res) => {
        setCollections(res.collections);
      })
      .catch((err) => {
        console.error("Failed to load collections:", err);
      });
  }, []);

  // Fetch icons when search query changes or collection resets
  useEffect(() => {
    setIsLoading(true);
    setOffset(0);

    fetchIcons(0, 100, debouncedQuery)
      .then((res) => {
        setItems(res.items);
        setTotalCount(res.total);
      })
      .catch((err) => {
        console.error("Failed to fetch icons:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [debouncedQuery]);

  // Load more icons on scroll
  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || items.length >= totalCount || items.length === 0) {
      return;
    }
    const nextOffset = offset + 100;
    setIsLoadingMore(true);

    try {
      const res = await fetchIcons(nextOffset, 100, debouncedQuery);
      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const newItems = res.items.filter((i) => !existingIds.has(i.id));
        return [...prev, ...newItems];
      });
      setOffset(nextOffset);
      if (res.total) {
        setTotalCount(res.total);
      }
    } catch (err) {
      console.error("Failed to load more icons on scroll:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, items.length, totalCount, offset, debouncedQuery]);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        root: containerRef.current,
        rootMargin: "350px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  // Fallback scroll handler for rapid trackpad/mousewheel scrolling
  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (isLoading || isLoadingMore || items.length >= totalCount || items.length === 0) return;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 300) {
      handleLoadMore();
    }
  };

  // Cache clear and refresh
  const handleRefreshCache = async () => {
    setIsRefreshingCache(true);
    try {
      await clearIconCache();
      if ("caches" in window) {
        await caches.delete("folderpainter-icons-v1");
      }
      setOffset(0);
      setIsLoading(true);
      const res = await fetchIcons(0, 100, debouncedQuery);
      setItems(res.items);
      setTotalCount(res.total);
    } catch (err) {
      console.warn("Failed to refresh cache:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshingCache(false);
    }
  };

  // Filter items by collection if selected
  const filteredItems = useMemo(() => {
    if (selectedCollectionId === "all") {
      return items;
    }
    return items.filter((item) => item.collectionId === selectedCollectionId);
  }, [items, selectedCollectionId]);

  // Group items by collection for display
  const groupedCollections = useMemo(() => {
    const map = new Map<string, IconItem[]>();
    for (const item of filteredItems) {
      const collId = item.collectionId;
      if (!map.has(collId)) {
        map.set(collId, []);
      }
      map.get(collId)!.push(item);
    }

    const collMetaMap = new Map<string, CollectionItem>();
    for (const c of collections) {
      collMetaMap.set(c.id, c);
    }

    const result: { id: string; title: string; author?: string; authorUrl?: string; items: IconItem[] }[] = [];
    for (const [collId, groupItems] of map.entries()) {
      const meta = collMetaMap.get(collId);
      result.push({
        id: collId,
        title: meta?.title || groupItems[0]?.library || collId,
        author: meta?.author?.name,
        authorUrl: meta?.author?.url,
        items: groupItems,
      });
    }
    return result;
  }, [filteredItems, collections]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search and Collection Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
        {/* Collections Dropdown */}
        <div className="relative shrink-0 sm:w-56">
          <select
            value={selectedCollectionId}
            onChange={(e) => setSelectedCollectionId(e.target.value)}
            className="w-full appearance-none px-3 py-2 text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 pr-8 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">
              All Collections ({collections.length || "114"})
            </option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} {c.author?.name ? `(${c.author.name})` : ""}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search icons (e.g. Adobe, AI, GitHub, Android, Games)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          )}
        </div>

        {/* Cache Refresh Action Button */}
        <button
          onClick={handleRefreshCache}
          disabled={isRefreshingCache || isLoading}
          title="Refresh cached icon catalog and thumbnails"
          className="px-2.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
        >
          {isRefreshingCache ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
          ) : (
            <Database className="w-3.5 h-3.5 text-zinc-500" />
          )}
          <span className="hidden sm:inline">Cache</span>
          <RotateCcw className={`w-3 h-3 ${isRefreshingCache ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Catalog Grid Area with Infinite Scroll */}
      <div
        ref={containerRef}
        onScroll={handleContainerScroll}
        className="flex-1 overflow-y-auto space-y-6 pr-1"
      >
        {groupedCollections.map((group) => (
          <div key={group.id} className="space-y-2.5">
            {/* Collection Group Header */}
            <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-1.5">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  {group.title}
                </span>
                {group.author && (
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    by {group.author}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                {group.items.length} icons
              </span>
            </div>

            {/* Icon Tiles Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {group.items.map((item) => {
                const asset256 = item.assets.find((a) => a.size === 256) || item.assets[0];
                const isSelected = selectedImageUrl === asset256?.url;

                return (
                  <button
                    key={item.id}
                    onClick={() => asset256 && onSelectIcon(asset256.url, item.name)}
                    title={item.name}
                    className={`group relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500 shadow-sm"
                        : "border-zinc-200/70 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 bg-white/60 dark:bg-zinc-900/40"
                    }`}
                  >
                    <div className="w-11 h-11 flex items-center justify-center transition-transform group-hover:scale-108">
                      {asset256 ? (
                        <CachedIconImage
                          src={asset256.url}
                          alt={item.name}
                          className="w-10 h-10 object-contain drop-shadow-xs"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 truncate w-full text-center mt-1 font-medium group-hover:text-zinc-900 dark:group-hover:text-zinc-200">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Infinite Scroll Sentinel & Loading Indicator */}
        {items.length < totalCount ? (
          <div
            ref={sentinelRef}
            className="flex flex-col items-center justify-center py-5 gap-2 text-zinc-400 dark:text-zinc-500"
          >
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-xs font-medium text-blue-500 bg-blue-50/60 dark:bg-blue-950/30 px-3 py-1.5 rounded-full border border-blue-200/50 dark:border-blue-900/50">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading more icons ({items.length} of {totalCount})...</span>
              </div>
            ) : (
              <button
                onClick={handleLoadMore}
                className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 py-1 px-3 rounded-md transition-colors"
              >
                Scroll to load more ({items.length} of {totalCount})
              </button>
            )}
          </div>
        ) : items.length > 0 ? (
          <div className="text-center py-6 text-xs text-zinc-400 dark:text-zinc-600 font-medium border-t border-zinc-100 dark:border-zinc-900">
            All {totalCount} icons loaded
          </div>
        ) : null}

        {filteredItems.length === 0 && !isLoading && (
          <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-xs">
            No icons found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};
