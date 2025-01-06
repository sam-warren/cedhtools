import { DBSchema, IDBPDatabase, openDB } from 'idb';

interface ImageCacheSchema extends DBSchema {
  images: {
    key: string;
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
  private static MAX_CACHE_SIZE = 2000;
  private static MAX_CACHE_AGE = 30 * 24 * 60 * 60 * 1000;
  private static BATCH_SIZE = 3; // Number of concurrent image loads
  private static BATCH_DELAY = 100; // Delay between batches in ms

  private loadingQueue: Array<{
    scryfall_id: string;
    imageUrl: string;
    resolve: (value: string) => void;
    reject: (reason?: any) => void;
  }> = [];
  private isProcessingQueue = false;

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
    // First check if image is already cached
    try {
      const db = await this.dbPromise;
      const existingCache = await db.get('images', scryfall_id);

      if (existingCache) {
        if (
          Date.now() - existingCache.timestamp <
          ImageCacheService.MAX_CACHE_AGE
        ) {
          return existingCache.dataUrl;
        }
      }
    } catch (error) {
      console.error('Cache check failed:', error);
    }

    // If not cached, add to queue and process
    return new Promise((resolve, reject) => {
      this.loadingQueue.push({
        scryfall_id,
        imageUrl,
        resolve,
        reject,
      });

      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.loadingQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.loadingQueue.length > 0) {
      const batch = this.loadingQueue.splice(0, ImageCacheService.BATCH_SIZE);

      try {
        await Promise.all(
          batch.map(async ({ scryfall_id, imageUrl, resolve, reject }) => {
            try {
              const dataUrl = await this.fetchAndCacheImage(
                scryfall_id,
                imageUrl,
              );
              resolve(dataUrl);
            } catch (error) {
              console.error('Failed to cache image:', error);
              reject(error);
            }
          }),
        );

        // Add delay between batches to prevent overwhelming the browser
        if (this.loadingQueue.length > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, ImageCacheService.BATCH_DELAY),
          );
        }
      } catch (error) {
        console.error('Batch processing failed:', error);
      }
    }

    this.isProcessingQueue = false;
  }

  private async fetchAndCacheImage(
    scryfall_id: string,
    imageUrl: string,
  ): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const dataUrl = await this.blobToDataURL(blob);

      const db = await this.dbPromise;
      await this.pruneCache(db);
      await db.put('images', {
        scryfall_id,
        dataUrl,
        timestamp: Date.now(),
      });

      return dataUrl;
    } catch (error) {
      console.error('Image fetch/cache failed:', error);
      return imageUrl; // Fallback to original URL
    }
  }

  private async pruneCache(db: IDBPDatabase<ImageCacheSchema>) {
    const allImages = await db.getAll('images');
    if (allImages.length >= ImageCacheService.MAX_CACHE_SIZE) {
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

  async clearCache() {
    const db = await this.dbPromise;
    await db.clear('images');
  }
}

export default new ImageCacheService();
