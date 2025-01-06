import { useCallback, useEffect, useState } from "react";
import imageCacheService from "src/services/cache/imageCacheService";

export function useImageCache(
  scryfall_id: string,
  imageUrl: string,
  priority: boolean = false,
) {
  const [cachedSrc, setCachedSrc] = useState<string>(imageUrl);
  const [isLoading, setIsLoading] = useState(true);

  const loadCachedImage = useCallback(async () => {
    try {
      setIsLoading(true);
      const cachedImage = await imageCacheService.cacheImage(
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
    if (priority) {
      loadCachedImage();
    } else {
      // Delay non-priority images to let priority images load first
      const timeoutId = setTimeout(loadCachedImage, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [loadCachedImage, priority]);

  return {
    src: cachedSrc,
    isLoading,
    reload: loadCachedImage,
  };
}
