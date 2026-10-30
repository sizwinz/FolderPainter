import React, { useState, useEffect, useRef } from "react";
import { Image as ImageIcon } from "lucide-react";

interface CachedIconImageProps {
  src: string;
  alt: string;
  className?: string;
}

const memoryBlobCache = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string>>();

let cacheInstancePromise: Promise<Cache | null> | null = null;
function getCache(): Promise<Cache | null> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return Promise.resolve(null);
  }
  if (!cacheInstancePromise) {
    cacheInstancePromise = caches.open("folderpainter-icons-v1").catch(() => null);
  }
  return cacheInstancePromise;
}

async function resolveIconUrl(src: string): Promise<string> {
  if (memoryBlobCache.has(src)) {
    return memoryBlobCache.get(src)!;
  }

  if (inFlightRequests.has(src)) {
    return inFlightRequests.get(src)!;
  }

  const fetchPromise = (async () => {
    try {
      const cache = await getCache();
      if (cache) {
        const match = await cache.match(src);
        if (match) {
          const blob = await match.blob();
          const blobUrl = URL.createObjectURL(blob);
          memoryBlobCache.set(src, blobUrl);
          return blobUrl;
        }

        const res = await fetch(src, { mode: "cors" });
        if (res.ok) {
          await cache.put(src, res.clone());
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          memoryBlobCache.set(src, blobUrl);
          return blobUrl;
        }
      }
    } catch {
      // Fallback on network/cors issue
    }

    memoryBlobCache.set(src, src);
    return src;
  })().finally(() => {
    inFlightRequests.delete(src);
  });

  inFlightRequests.set(src, fetchPromise);
  return fetchPromise;
}

export const CachedIconImage: React.FC<CachedIconImageProps> = ({
  src,
  alt,
  className = "w-10 h-10 object-contain drop-shadow-xs",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string>(() => memoryBlobCache.get(src) || "");
  const [isLoaded, setIsLoaded] = useState(() => memoryBlobCache.has(src));
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(() => memoryBlobCache.has(src));

  // Intersection observer: only load image when near viewport
  useEffect(() => {
    if (memoryBlobCache.has(src)) {
      setImageSrc(memoryBlobCache.get(src)!);
      setIsVisible(true);
      setIsLoaded(true);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    let observer: IntersectionObserver | null = null;
    try {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setIsVisible(true);
            observer?.disconnect();
          }
        },
        { rootMargin: "300px" }
      );
      observer.observe(el);
    } catch {
      setIsVisible(true);
    }

    return () => {
      observer?.disconnect();
    };
  }, [src]);

  // Load image when visible
  useEffect(() => {
    if (!isVisible) return;
    let isMounted = true;

    if (memoryBlobCache.has(src)) {
      setImageSrc(memoryBlobCache.get(src)!);
      setIsLoaded(true);
      return;
    }

    resolveIconUrl(src)
      .then((resolvedUrl) => {
        if (isMounted) {
          setImageSrc(resolvedUrl);
        }
      })
      .catch(() => {
        if (isMounted) {
          setImageSrc(src);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isVisible, src]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center min-h-[40px]"
    >
      {!isLoaded && !hasError && (
        <div className="absolute inset-1 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-md animate-pulse" />
      )}
      {hasError ? (
        <ImageIcon className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
      ) : imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`${className} transition-opacity duration-150 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </div>
  );
};
