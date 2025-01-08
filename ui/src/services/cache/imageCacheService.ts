// imageCacheService.ts
type CacheCallback = {
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
};

class ImageCacheService {
  private worker: Worker;
  private callbacks: Map<string, CacheCallback> = new Map();
  private static BATCH_SIZE = 2;
  private static BATCH_DELAY = 200;
  private static MAX_RETRIES = 2;
  private static RETRY_DELAY = 1000;
  private static FALLBACK_IMAGE = import.meta.env.VITE_CARD_NOT_FOUND_IMAGE_URL;

  private loadingQueue: Array<{
    scryfall_id: string;
    imageUrl: string;
    resolve: (value: string) => void;
    reject: (reason: unknown) => void;
    retries?: number;
  }> = [];
  private isProcessingQueue = false;

  constructor() {
    this.worker = new Worker(
      new URL('../../workers/imageCache.worker.ts', import.meta.url),
      {
        type: 'module',
      },
    );

    this.worker.onmessage = (event) => {
      const { type, payload } = event.data;

      if (type === 'success' && payload.scryfall_id) {
        const callbacks = this.callbacks.get(payload.scryfall_id);
        if (callbacks) {
          callbacks.resolve(payload.dataUrl);
          this.callbacks.delete(payload.scryfall_id);
        }
      } else if (type === 'error' && payload.scryfall_id) {
        const callbacks = this.callbacks.get(payload.scryfall_id);
        if (callbacks) {
          callbacks.reject(new Error(payload.error));
          this.callbacks.delete(payload.scryfall_id);
        }
      } else if (type === 'cacheClearSuccess') {
        // Handle cache clear success if needed
      } else if (type === 'cacheClearError') {
        console.warn('Cache clear failed:', payload.error);
      }
    };

    this.worker.onerror = (error) => {
      console.warn('Worker error:', error);
      this.callbacks.forEach((callback) => {
        this.handleFallbackImage(callback.resolve, callback.reject);
      });
      this.callbacks.clear();
    };
  }

  private async handleFallbackImage(
    resolve: (value: string) => void,
    reject: (reason: unknown) => void,
  ): Promise<void> {
    try {
      const fallbackResponse = await fetch(ImageCacheService.FALLBACK_IMAGE);
      if (fallbackResponse.ok) {
        const fallbackDataUrl = await fallbackResponse.text();
        resolve(fallbackDataUrl);
      } else {
        reject(new Error('Failed to load fallback image'));
      }
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async cacheImage(scryfall_id: string, imageUrl?: string): Promise<string> {
    // Early validation for missing or empty URL
    if (!imageUrl) {
      console.warn(`No image URL provided for scryfall_id: ${scryfall_id}`);
      return new Promise((resolve, reject) => {
        this.handleFallbackImage(resolve, reject);
      });
    }

    return new Promise((resolve, reject) => {
      this.loadingQueue.push({
        scryfall_id,
        imageUrl,
        resolve,
        reject,
      });

      if (!this.isProcessingQueue) {
        void this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.loadingQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.loadingQueue.length > 0) {
        const batch = this.loadingQueue.splice(0, ImageCacheService.BATCH_SIZE);

        await Promise.all(
          batch.map(
            ({ scryfall_id, imageUrl, resolve, reject, retries = 0 }) => {
              return new Promise<void>((promiseResolve) => {
                const handleError = async (error: unknown) => {
                  console.warn(
                    `Cache attempt ${retries + 1} failed for ${scryfall_id}:`,
                    error,
                  );

                  if (retries < ImageCacheService.MAX_RETRIES) {
                    const backoffDelay =
                      ImageCacheService.RETRY_DELAY * Math.pow(2, retries);

                    this.loadingQueue.push({
                      scryfall_id,
                      imageUrl,
                      resolve,
                      reject,
                      retries: retries + 1,
                    });

                    setTimeout(() => {
                      if (!this.isProcessingQueue) {
                        void this.processQueue();
                      }
                    }, backoffDelay);
                  } else {
                    await this.handleFallbackImage(resolve, reject);
                  }
                  promiseResolve();
                };

                this.callbacks.set(scryfall_id, {
                  resolve: (value) => {
                    resolve(value);
                    promiseResolve();
                  },
                  reject: handleError,
                });

                this.worker.postMessage({
                  type: 'cacheImage',
                  payload: { scryfall_id, imageUrl },
                });
              });
            },
          ),
        );

        if (this.loadingQueue.length > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, ImageCacheService.BATCH_DELAY),
          );
        }
      }
    } catch (error) {
      console.warn('Queue processing failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Try to resolve with fallback images for all pending callbacks
      await Promise.all(
        Array.from(this.callbacks.values()).map(({ resolve, reject }) =>
          this.handleFallbackImage(resolve, reject),
        ),
      );

      this.callbacks.clear();
    } finally {
      this.isProcessingQueue = false;
    }
  }

  async clearCache(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Clear cache timeout'));
      }, 5000);

      const handler = (event: MessageEvent) => {
        if (event.data.type === 'cacheClearSuccess') {
          clearTimeout(timeoutId);
          this.worker.removeEventListener('message', handler);
          resolve();
        } else if (event.data.type === 'cacheClearError') {
          clearTimeout(timeoutId);
          this.worker.removeEventListener('message', handler);
          reject(new Error(event.data.payload.error));
        }
      };

      this.worker.addEventListener('message', handler);
      this.worker.postMessage({ type: 'clearCache' });
    });
  }

  dispose(): void {
    this.worker.terminate();
  }
}

export default new ImageCacheService();
