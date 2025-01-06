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
  private static PRUNE_THRESHOLD = 100; // Only prune when we're this many items over limit
  private static PRUNE_BATCH = 50; // Remove this many items when pruning

  private loadingQueue: Array<{
    scryfall_id: string;
    imageUrl: string;
    resolve: (value: string) => void;
    reject: (reason?: any) => void;
  }> = [];
  private isProcessingQueue = false;
  private entryCount = 0;
  private lastPruneTime = 0;
  private static PRUNE_COOLDOWN = 5000; // Minimum ms between prunes

  constructor() {
    this.dbPromise = openDB<ImageCacheSchema>(ImageCacheService.CACHE_NAME, 1, {
      upgrade(db) {
        db.createObjectStore('images', {
          keyPath: 'scryfall_id',
        });
      },
    });

    // Initialize entry count
    this.dbPromise.then(async (db) => {
      this.entryCount = await db.count('images');
    });
  }

  private async pruneIfNeeded(db: IDBPDatabase<ImageCacheSchema>) {
    const now = Date.now();

    // Check if we need to prune and if enough time has passed since last prune
    if (
      this.entryCount <
        ImageCacheService.MAX_CACHE_SIZE + ImageCacheService.PRUNE_THRESHOLD ||
      now - this.lastPruneTime < ImageCacheService.PRUNE_COOLDOWN
    ) {
      return;
    }

    try {
      // Get only the keys first - more efficient than getting all data
      const keys = await db.getAllKeys('images');
      if (
        keys.length >=
        ImageCacheService.MAX_CACHE_SIZE + ImageCacheService.PRUNE_THRESHOLD
      ) {
        // Get only the timestamps we need
        const entries = await Promise.all(
          keys.map(async (key) => {
            const entry = await db.get('images', key);
            if (!entry) {
              // If entry somehow doesn't exist, use oldest possible timestamp
              return { key, timestamp: 0 };
            }
            return { key, timestamp: entry.timestamp };
          }),
        );

        // Sort by timestamp and get oldest entries
        const sortedEntries = entries.sort((a, b) => a.timestamp - b.timestamp);
        const keysToRemove = sortedEntries
          .slice(0, ImageCacheService.PRUNE_BATCH)
          .map((entry) => entry.key);

        // Batch delete oldest entries
        await Promise.all(keysToRemove.map((key) => db.delete('images', key)));

        this.entryCount -= keysToRemove.length;
        this.lastPruneTime = now;
      }
    } catch (error) {
      console.error('Pruning failed:', error);
    }
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
      await db.put('images', {
        scryfall_id,
        dataUrl,
        timestamp: Date.now(),
      });

      this.entryCount++;
      await this.pruneIfNeeded(db);

      return dataUrl;
    } catch (error) {
      console.error('Image fetch/cache failed:', error);
      return imageUrl; // Fallback to original URL
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
    this.entryCount = 0;
  }
}

export default new ImageCacheService();
