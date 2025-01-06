// imageCacheWorker.ts
import { IDBPDatabase, openDB } from 'idb';

interface ImageCacheSchema {
  images: {
    key: string;
    value: {
      dataUrl: string;
      timestamp: number;
      scryfall_id: string;
    };
  };
}

const CACHE_NAME = 'card-image-cache';
const MAX_CACHE_SIZE = 2000;
const MAX_CACHE_AGE = 30 * 24 * 60 * 60 * 1000;
const PRUNE_THRESHOLD = 100;
const PRUNE_BATCH = 50;
const PRUNE_COOLDOWN = 5000;

let db: IDBPDatabase<ImageCacheSchema>;
let entryCount = 0;
let lastPruneTime = 0;
let dbInitPromise: Promise<void>;

async function initDB() {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      try {
        db = await openDB(CACHE_NAME, 1, {
          upgrade(db) {
            db.createObjectStore('images', { keyPath: 'scryfall_id' });
          },
        });
        entryCount = await db.count('images');
      } catch (error) {
        console.error('DB initialization failed:', error);
        throw error;
      }
    })();
  }
  return dbInitPromise;
}

async function pruneIfNeeded() {
  const now = Date.now();

  if (
    entryCount < MAX_CACHE_SIZE + PRUNE_THRESHOLD ||
    now - lastPruneTime < PRUNE_COOLDOWN
  ) {
    return;
  }

  try {
    const keys = await db.getAllKeys('images');
    if (keys.length >= MAX_CACHE_SIZE + PRUNE_THRESHOLD) {
      const entries = await Promise.all(
        keys.map(async (key) => {
          const entry = await db.get('images', key);
          return { key, timestamp: entry?.timestamp || 0 };
        }),
      );

      const sortedEntries = entries.sort((a, b) => a.timestamp - b.timestamp);
      const keysToRemove = sortedEntries
        .slice(0, PRUNE_BATCH)
        .map((entry) => entry.key);

      await Promise.all(keysToRemove.map((key) => db.delete('images', key)));

      entryCount -= keysToRemove.length;
      lastPruneTime = now;
    }
  } catch (error) {
    console.error('Pruning failed:', error);
    throw error;
  }
}

async function cacheImage(
  scryfall_id: string,
  imageUrl: string,
): Promise<string> {
  try {
    const existingCache = await db.get('images', scryfall_id);
    if (existingCache && Date.now() - existingCache.timestamp < MAX_CACHE_AGE) {
      // When returning cached data, create a Response with cache headers
      return new Response(existingCache.dataUrl, {
        headers: {
          'Cache-Control': 'public, max-age=2592000', // 30 days
          Expires: new Date(Date.now() + MAX_CACHE_AGE).toUTCString(),
        },
      }).text();
    }

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'cedhtools',
      },
      credentials: 'omit',
    });

    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Store in IndexedDB
    await db.put('images', {
      scryfall_id,
      dataUrl,
      timestamp: Date.now(),
    });

    entryCount++;
    await pruneIfNeeded();

    // Return with cache headers
    return new Response(dataUrl, {
      headers: {
        'Cache-Control': 'public, max-age=2592000', // 30 days
        Expires: new Date(Date.now() + MAX_CACHE_AGE).toUTCString(),
      },
    }).text();
  } catch (error) {
    console.error('Worker cache error:', error);
    throw error;
  }
}

// Initialize DB when worker starts
initDB().catch((error) => {
  console.error('Failed to initialize DB:', error);
});

// Handle messages from main thread
self.addEventListener('message', async (event: MessageEvent) => {
  try {
    await initDB(); // Wait for DB initialization before processing any message

    if (event.data?.type === 'cacheImage') {
      try {
        const dataUrl = await cacheImage(
          event.data.payload.scryfall_id,
          event.data.payload.imageUrl,
        );
        self.postMessage({
          type: 'success',
          payload: {
            scryfall_id: event.data.payload.scryfall_id,
            dataUrl,
          },
        });
      } catch (error) {
        self.postMessage({
          type: 'error',
          payload: {
            scryfall_id: event.data.payload.scryfall_id,
            error:
              error instanceof Error ? error.message : 'Unknown error occurred',
          },
        });
      }
    } else if (event.data?.type === 'clearCache') {
      try {
        await db.clear('images');
        entryCount = 0;
        self.postMessage({ type: 'cacheClearSuccess' });
      } catch (error) {
        self.postMessage({
          type: 'cacheClearError',
          payload: {
            error:
              error instanceof Error ? error.message : 'Unknown error occurred',
          },
        });
      }
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      payload: {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
    });
  }
});
