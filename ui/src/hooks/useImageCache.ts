import { useState, useEffect, useCallback } from 'react';
import ImageCacheService from 'src/services/cache/imageCacheService';

export function useImageCache(scryfall_id: string, imageUrl: string) {
  const [cachedSrc, setCachedSrc] = useState<string>(imageUrl);
  const [isLoading, setIsLoading] = useState(true);

  const loadCachedImage = useCallback(async () => {
    try {
      setIsLoading(true);
      const cachedImage = await ImageCacheService.cacheImage(
        scryfall_id,
        imageUrl,
      );
      setCachedSrc(cachedImage);
    } catch (error) {
      console.error('Image caching failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [scryfall_id, imageUrl]);

  useEffect(() => {
    loadCachedImage();
  }, [loadCachedImage]);

  return {
    src: cachedSrc,
    isLoading,
    reload: loadCachedImage,
  };
}
