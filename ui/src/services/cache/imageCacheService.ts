import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ImageCacheSchema extends DBSchema {
  images: {
    key: string; // scryfall_id
    value: {
      dataUrl: string;
      timestamp: number;
      scryfall_id: string;
    };
  };
}

class ImageCacheService {
  private dbPromise: Promise<IDBPDatabase<ImageCacheSchema>>;
  private static CACHE_NAME = 'card-image-cache';
  private static MAX_CACHE_SIZE = 500; // Limit cache to 500 images
  private static MAX_CACHE_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor() {
    this.dbPromise = openDB<ImageCacheSchema>(ImageCacheService.CACHE_NAME, 1, {
      upgrade(db) {
        db.createObjectStore('images', {
          keyPath: 'scryfall_id',
        });
      },
    });
  }

  async cacheImage(scryfall_id: string, imageUrl: string): Promise<string> {
    try {
      // Check if image exists in cache
      const db = await this.dbPromise;
      const existingCache = await db.get('images', scryfall_id);

      if (existingCache) {
        // Check if cache is still valid
        if (
          Date.now() - existingCache.timestamp <
          ImageCacheService.MAX_CACHE_AGE
        ) {
          return existingCache.dataUrl;
        }
      }

      // Fetch and cache image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const dataUrl = await this.blobToDataURL(blob);

      // Store in IndexedDB
      await this.pruneCache(db);
      await db.put('images', {
        scryfall_id,
        dataUrl,
        timestamp: Date.now(),
      });

      return dataUrl;
    } catch (error) {
      console.error('Image caching error:', error);
      return imageUrl; // Fallback to original URL
    }
  }

  private async pruneCache(db: IDBPDatabase<ImageCacheSchema>) {
    const allImages = await db.getAll('images');
    if (allImages.length >= ImageCacheService.MAX_CACHE_SIZE) {
      // Sort by oldest first and remove oldest entries
      const sortedImages = allImages.sort((a, b) => a.timestamp - b.timestamp);
      const entriesToRemove = sortedImages.slice(
        0,
        allImages.length - ImageCacheService.MAX_CACHE_SIZE + 1,
      );

      for (const entry of entriesToRemove) {
        await db.delete('images', entry.scryfall_id);
      }
    }
  }

  private blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Optional: Method to clear entire cache
  async clearCache() {
    const db = await this.dbPromise;
    await db.clear('images');
  }
}

export default new ImageCacheService();
