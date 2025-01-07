// useImageCache.ts
import { useEffect, useRef, useState } from 'react';
import ImageCacheService from 'src/services/cache/imageCacheService';

export function useImageCache(
  scryfall_id: string,
  imageUrl: string,
  inView: boolean,
) {
  const [cachedSrc, setCachedSrc] = useState<string>(imageUrl);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!inView) return;

    let currentSrc = imageUrl;
    const img = new Image();

    const loadImage = async () => {
      try {
        // Start loading the CDN image immediately
        img.src = imageUrl;

        // Try to get cached version in parallel
        const cachedUrl = await ImageCacheService.cacheImage(
          scryfall_id,
          imageUrl,
        );

        // Only update if the component is still mounted and we haven't changed images
        if (isMountedRef.current && currentSrc === imageUrl) {
          // Verify the cached URL is valid
          const cachedImg = new Image();
          cachedImg.onload = () => {
            if (isMountedRef.current && currentSrc === imageUrl) {
              setCachedSrc(cachedUrl);
              setError(null);
            }
          };
          cachedImg.onerror = () => {
            if (isMountedRef.current && currentSrc === imageUrl) {
              setCachedSrc(imageUrl);
            }
          };
          cachedImg.src = cachedUrl;
        }
      } catch (err) {
        console.warn('Image caching failed:', err);
        if (isMountedRef.current && currentSrc === imageUrl) {
          setError(err instanceof Error ? err : new Error(String(err)));
          // Keep using the CDN URL
          setCachedSrc(imageUrl);
        }
      }
    };

    void loadImage();

    return () => {
      currentSrc = ''; // Mark that we've unmounted/changed images
      img.src = ''; // Cancel any pending loads
    };
  }, [scryfall_id, imageUrl, inView]);

  return {
    src: cachedSrc,
    error,
    isLoading: false,
  };
}
