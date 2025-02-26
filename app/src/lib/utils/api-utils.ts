'use server';

/**
 * A collection of higher-order functions and utilities to reduce repetition in service layer
 */

/**
 * Creates a function that fetches a list of items from mock data
 * @param mockData The mock data array to use
 * @returns A function that returns a Promise resolving to the mock data
 */
export async function createMockListFetcher<T>(mockData: T[]): Promise<() => Promise<T[]>> {
  return () => Promise.resolve(mockData);
}

/**
 * Creates a function that fetches a single item by ID from mock data
 * @param mockData The mock data array to search
 * @param idField The field name to use as the ID (defaults to 'id')
 * @returns A function that takes an ID and returns a Promise resolving to the item or null
 */
export async function createMockItemFetcher<T>(
  mockData: T[],
  idField: keyof T = 'id' as keyof T
): Promise<(id: string) => Promise<T | null>> {
  return (id: string) => {
    const item = mockData.find((item) => String(item[idField]) === id);
    return Promise.resolve(item || null);
  };
}

/**
 * Creates a function that fetches a single item by ID and enhances it with additional data
 * @param mockData The mock data array to search
 * @param enhancer A function that takes the found item and enhances it with additional data
 * @param idField The field name to use as the ID (defaults to 'id')
 * @returns A function that takes an ID and returns a Promise resolving to the enhanced item or null
 */
export async function createMockItemWithDetailsFetcher<T, R>(
  mockData: T[],
  enhancer: (item: T) => R,
  idField: keyof T = 'id' as keyof T
): Promise<(id: string) => Promise<R | null>> {
  return async (id: string) => {
    const item = mockData.find((item) => String(item[idField]) === id);
    if (!item) return Promise.resolve(null);
    return Promise.resolve(enhancer(item));
  };
}

/**
 * Safely handles API requests with proper error handling
 * @param fn The async function to execute
 * @returns A wrapped function with error handling that preserves the original function's signature
 */
export async function withErrorHandling<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>
): Promise<(...args: TArgs) => Promise<TReturn>> {
  return async (...args: TArgs): Promise<TReturn> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    }
  };
}

/**
 * Creates a function that fetches data related to a specific parent item
 * @param parentIdParam The name of the parent ID parameter (for documentation purposes)
 * @param mockDataGenerator A function that generates mock data based on the parent ID
 * @returns A function that takes a parent ID and returns a Promise resolving to the related data
 */
export async function createRelatedItemsFetcher<T>(
  parentIdParam: string,
  mockDataGenerator: (parentId: string) => T
): Promise<(parentId: string) => Promise<T>> {
  return async (parentId: string) => Promise.resolve(mockDataGenerator(parentId));
}

/**
 * Adds caching to a service function
 * @param fn The function to cache
 * @param ttlMs Time to live in milliseconds (default: 5 minutes)
 * @returns A cached version of the function with the same signature
 */
export async function withCache<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  ttlMs: number = 5 * 60 * 1000
): Promise<(...args: TArgs) => Promise<TReturn>> {
  // Create a cache to store results
  const cache = new Map<string, { data: TReturn; timestamp: number }>();
  
  return async (...args: TArgs): Promise<TReturn> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttlMs) {
      return cached.data;
    }
    
    const result = await fn(...args);
    cache.set(key, { data: result, timestamp: Date.now() });
    return result;
  };
}

/**
 * Creates a transaction handler for database operations
 * @param handler The function that performs the database operation
 * @param db The database client
 * @returns A function that executes the handler within a transaction
 */
export async function withTransaction<TArgs extends unknown[], TReturn, TDb>(
  handler: (tx: TDb, ...args: TArgs) => Promise<TReturn>,
  db: { transaction: (fn: (tx: TDb) => Promise<TReturn>) => Promise<TReturn> }
): Promise<(...args: TArgs) => Promise<TReturn>> {
  return async (...args: TArgs): Promise<TReturn> => {
    return db.transaction(async (tx) => {
      return handler(tx, ...args);
    });
  };
}

/**
 * Creates a function that validates input data before processing
 * @param validator The validation function
 * @param handler The handler function to execute if validation passes
 * @returns A function that validates input and then executes the handler
 */
export async function withValidation<TArgs extends unknown[], TReturn>(
  validator: (...args: TArgs) => { valid: boolean; errors?: string[] },
  handler: (...args: TArgs) => Promise<TReturn>
): Promise<(...args: TArgs) => Promise<TReturn>> {
  return async (...args: TArgs): Promise<TReturn> => {
    const validation = validator(...args);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
    }
    return handler(...args);
  };
} 