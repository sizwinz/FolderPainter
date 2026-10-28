import React, { useState, useEffect } from "react";
import { Image as ImageIcon } from "lucide-react";

interface CachedIconImageProps {
  src: string;
  alt: string;
  className?: string;
}

const memoryBlobCache = new Map<string, string>();

export const CachedIconImage: React.FC<CachedIconImageProps> = ({
  src,
  alt,
  className = "w-10 h-10 object-contain drop-shadow-xs",
}) => {
  const [imageSrc, setImageSrc] = useState<string>(() => memoryBlobCache.get(src) || src);
  const [isLoaded, setIsLoaded] = useState(() => memoryBlobCache.has(src));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (memoryBlobCache.has(src)) {
      setImageSrc(memoryBlobCache.get(src)!);
      setIsLoaded(true);
      return;
    }

    if ("caches" in window) {
      caches
        .open("folderpainter-icons-v1")
        .then(async (cache) => {
          try {
            const match = await cache.match(src);
            if (match && isMounted) {
              const blob = await match.blob();
              const blobUrl = URL.createObjectURL(blob);
              memoryBlobCache.set(src, blobUrl);
              setImageSrc(blobUrl);
              setIsLoaded(true);
              return;
            }

            const res = await fetch(src, { mode: "cors" });
            if (res.ok) {
              await cache.put(src, res.clone());
              const blob = await res.blob();
              if (isMounted) {
                const blobUrl = URL.createObjectURL(blob);
                memoryBlobCache.set(src, blobUrl);
                setImageSrc(blobUrl);
                setIsLoaded(true);
              }
            }
          } catch {
            // Fallback to standard src
            if (isMounted) {
              setImageSrc(src);
            }
          }
        })
        .catch(() => {
          if (isMounted) {
            setImageSrc(src);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {!isLoaded && !hasError && (
        <div className="absolute inset-1 bg-zinc-200/60 dark:bg-zinc-800/60 rounded-md animate-pulse" />
      )}
      {hasError ? (
        <ImageIcon className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`${className} transition-opacity duration-200 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
};
