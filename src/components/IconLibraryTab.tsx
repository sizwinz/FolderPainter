import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Search, Globe, Loader2, Layers, RotateCcw, Database, X } from "lucide-react";
import { fetchCollections, fetchIcons, clearIconCache } from "../lib/invoke";
import { CachedIconImage } from "./CachedIconImage";
import type { CollectionItem, IconItem } from "../lib/types";

interface IconLibraryTabProps {
  selectedImageUrl: string | null;
  onSelectIcon: (assetUrl: string, name: string) => void;
}

function filterIconsByQuery(
  iconList: IconItem[],
  query: string,
  collectionId: string
): IconItem[] {
  let list = iconList;
  if (collectionId !== "all") {
    list = list.filter((item) => item.collectionId === collectionId);
  }

  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return list;
  }

  const tokens = cleanQuery.split(/\s+/).filter(Boolean);

  const matched = list.filter((item) => {
    const name = item.name.toLowerCase();
    const lib = (item.library || "").toLowerCase();
    const coll = item.collectionId.toLowerCase();
    const tags = item.tags ? item.tags.map((t) => t.toLowerCase()) : [];

    return tokens.every(
      (token) =>
        name.includes(token) ||
        lib.includes(token) ||
        coll.includes(token) ||
        tags.some((t) => t.includes(token))
    );
  });

  // Relevance ranking: exact prefix match on name comes first
  const primaryToken = tokens[0];
  matched.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aStarts = aName.startsWith(primaryToken);
    const bStarts = bName.startsWith(primaryToken);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return aName.localeCompare(bName);
  });

  return matched;
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
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // High-performance icon storage & race-condition token
  const allKnownIconsMap = useRef<Map<string, IconItem>>(new Map());
  const defaultCatalogItems = useRef<IconItem[]>([]);
  const searchRequestIdRef = useRef<number>(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Fast debounce (200ms) for background remote search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load collections catalog list once
  useEffect(() => {
    fetchCollections()
      .then((res) => {
        setCollections(res.collections);
      })
      .catch((err) => {
        console.warn("Failed to load collections:", err);
      });
  }, []);

  // Initial catalog load
  useEffect(() => {
    setIsLoading(true);
    fetchIcons(0, 100)
      .then((res) => {
        for (const item of res.items) {
          allKnownIconsMap.current.set(item.id, item);
        }
        defaultCatalogItems.current = res.items;
        setItems(res.items);
        setTotalCount(res.total);
      })
      .catch((err) => {
        console.warn("Failed to fetch initial icons:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Instant local filtering on every single keystroke (0ms latency)
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const clean = val.trim();

    if (!clean) {
      const base =
        selectedCollectionId === "all"
          ? defaultCatalogItems.current
          : defaultCatalogItems.current.filter((i) => i.collectionId === selectedCollectionId);
      setItems(base);
      return;
    }

    const localMatches = filterIconsByQuery(
      Array.from(allKnownIconsMap.current.values()),
      clean,
      selectedCollectionId
    );
    setItems(localMatches);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    const base =
      selectedCollectionId === "all"
        ? defaultCatalogItems.current
        : defaultCatalogItems.current.filter((i) => i.collectionId === selectedCollectionId);
    setItems(base);
  };

  // Background remote search with race-condition prevention
  useEffect(() => {
    const query = debouncedQuery.trim();
    if (!query) return;

    const currentReqId = ++searchRequestIdRef.current;
    setIsSearchingRemote(true);
    setOffset(0);

    fetchIcons(0, 100, query)
      .then((res) => {
        // Drop stale responses if a newer search request was triggered
        if (currentReqId !== searchRequestIdRef.current) return;

        for (const item of res.items) {
          allKnownIconsMap.current.set(item.id, item);
        }

        const updatedMatches = filterIconsByQuery(
          Array.from(allKnownIconsMap.current.values()),
          query,
          selectedCollectionId
        );

        setItems(updatedMatches);
        if (res.total) {
          setTotalCount(res.total);
        }
      })
      .catch((err) => {
        console.warn("Background remote icon search:", err);
      })
      .finally(() => {
        if (currentReqId === searchRequestIdRef.current) {
          setIsSearchingRemote(false);
        }
      });
  }, [debouncedQuery, selectedCollectionId]);

  // Handle collection dropdown change
  const handleCollectionChange = (newColId: string) => {
    setSelectedCollectionId(newColId);
    const clean = searchQuery.trim();
    if (clean) {
      const filtered = filterIconsByQuery(
        Array.from(allKnownIconsMap.current.values()),
        clean,
        newColId
      );
      setItems(filtered);
    } else {
      const base =
        newColId === "all"
          ? defaultCatalogItems.current
          : defaultCatalogItems.current.filter((i) => i.collectionId === newColId);
      setItems(base);
    }
  };

  // Load more icons on infinite scroll
  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || items.length >= totalCount || items.length === 0) {
      return;
    }
    const nextOffset = offset + 100;
    setIsLoadingMore(true);

    try {
      const res = await fetchIcons(nextOffset, 100, debouncedQuery || undefined);
      for (const item of res.items) {
        allKnownIconsMap.current.set(item.id, item);
      }

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
      console.warn("Failed to load more icons on scroll:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, items.length, totalCount, offset, debouncedQuery]);

  // Infinite scroll intersection observer
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

  // Fallback scroll handler for rapid mouse wheel scrolling
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
      allKnownIconsMap.current.clear();
      defaultCatalogItems.current = [];
      setOffset(0);
      setIsLoading(true);

      const res = await fetchIcons(0, 100, debouncedQuery || undefined);
      for (const item of res.items) {
        allKnownIconsMap.current.set(item.id, item);
      }
      defaultCatalogItems.current = res.items;
      setItems(res.items);
      setTotalCount(res.total);
    } catch (err) {
      console.warn("Failed to refresh cache:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshingCache(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showClearConfirm) {
        setShowClearConfirm(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showClearConfirm]);

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

    const result: {
      id: string;
      title: string;
      author?: string;
      authorUrl?: string;
      items: IconItem[];
    }[] = [];

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
    <div className="flex flex-col h-full space-y-3.5">
      {/* Search and Collection Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
        {/* Collections Dropdown */}
        <div className="relative shrink-0 sm:w-56">
          <select
            value={selectedCollectionId}
            onChange={(e) => handleCollectionChange(e.target.value)}
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

        {/* High Performance Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search icons (e.g. Adobe, AI, GitHub, Android, Games)..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-14 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSearchingRemote && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                title="Clear search"
                className="p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Cache Refresh Action Button */}
        <button
          onClick={() => setShowClearConfirm(true)}
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

      {/* Results Header / Match Counter */}
      {searchQuery && (
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
          <span>
            Found <strong className="text-zinc-800 dark:text-zinc-200">{filteredItems.length}</strong> matching icon{filteredItems.length === 1 ? "" : "s"}
          </span>
          <button
            onClick={handleClearSearch}
            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Clear Cache Confirmation Modal */}
      {showClearConfirm && (
        <div
          onClick={() => setShowClearConfirm(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Clear Icon Cache?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  This will purge locally cached catalog lists, icon thumbnails, and downloaded assets. Fresh data will be downloaded from the repository.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={isRefreshingCache}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowClearConfirm(false);
                  await handleRefreshCache();
                }}
                disabled={isRefreshingCache}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Grid Area with Infinite Scroll */}
      <div
        ref={containerRef}
        onScroll={handleContainerScroll}
        className="flex-1 overflow-y-auto space-y-6 pr-2"
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
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-2">
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
        {items.length < totalCount && !searchQuery ? (
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
        ) : items.length > 0 && !searchQuery ? (
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
