// useImageCache.ts
import { useEffect, useState } from 'react';
import ImageCacheService from 'src/services/cache/imageCacheService';

export function useImageCache(
  scryfall_id: string,
  imageUrl: string,
  inView: boolean,
) {
  const [cachedSrc, setCachedSrc] = useState<string>(imageUrl); // Start with CDN URL

  useEffect(() => {
    if (!inView) return;

    // Try to cache in the background
    ImageCacheService.cacheImage(scryfall_id, imageUrl)
      .then((cachedUrl) => {
        setCachedSrc(cachedUrl);
      })
      .catch(() => {
        // On error, keep using the CDN URL
        console.warn('Failed to cache image, using CDN URL');
      });
  }, [scryfall_id, imageUrl, inView]);

  return {
    src: cachedSrc,
    isLoading: false, // We're never in a loading state now since we show CDN image immediately
  };
}
