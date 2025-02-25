'use server';

/**
 * A collection of higher-order functions and utilities to reduce repetition in service layer
 */

/**
 * Creates a function that fetches a list of items from mock data
 * @param mockData The mock data array to use
 * @returns A function that returns a Promise resolving to the mock data
 */
export function createMockListFetcher<T>(mockData: T[]) {
  return async (): Promise<T[]> => {
    return Promise.resolve(mockData);
  };
}

/**
 * Creates a function that fetches a single item by ID from mock data
 * @param mockData The mock data array to search
 * @param idField The field name to use as the ID (defaults to 'id')
 * @returns A function that takes an ID and returns a Promise resolving to the item or null
 */
export function createMockItemFetcher<T>(mockData: T[], idField: keyof T = 'id' as keyof T) {
  return async (id: string): Promise<T | null> => {
    const item = mockData.find(item => (item[idField] as unknown as string) === id);
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
export function createMockItemWithDetailsFetcher<T, R>(
  mockData: T[],
  enhancer: (item: T) => R,
  idField: keyof T = 'id' as keyof T
) {
  return async (id: string): Promise<R | null> => {
    const item = mockData.find(item => (item[idField] as unknown as string) === id);
    if (!item) return null;
    return Promise.resolve(enhancer(item));
  };
}

/**
 * Safely handles API requests with proper error handling
 * @param handler The async function to execute
 * @returns A function that wraps the handler with error handling
 */
export function withErrorHandling<Args extends unknown[], Return>(
  handler: (...args: Args) => Promise<Return>
): (...args: Args) => Promise<Return> {
  return async (...args: Args): Promise<Return> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('Service error:', error);
      throw error;
    }
  };
}

/**
 * Creates a function that fetches data related to a specific parent item
 * @param parentIdParam The name of the parent ID parameter
 * @param mockDataGenerator A function that generates mock data based on the parent ID
 * @returns A function that takes a parent ID and returns a Promise resolving to the related data
 */
export function createRelatedItemsFetcher<T, P extends string>(
  parentIdParam: P,
  mockDataGenerator: (parentId: string) => T
) {
  return async (parentId: string): Promise<T> => {
    return Promise.resolve(mockDataGenerator(parentId));
  };
}

/**
 * Adds caching to a service function
 * @param fn The function to cache
 * @param ttlMs Time to live in milliseconds (default: 5 minutes)
 * @returns A cached version of the function
 */
export function withCache<Args extends unknown[], Return>(
  fn: (...args: Args) => Promise<Return>,
  ttlMs: number = 5 * 60 * 1000
): (...args: Args) => Promise<Return> {
  const cache = new Map<string, { data: Return; timestamp: number }>();
  
  return async (...args: Args): Promise<Return> => {
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
export function withTransaction<Args extends unknown[], Return, DB>(
  handler: (tx: DB, ...args: Args) => Promise<Return>,
  db: { transaction: (fn: (tx: DB) => Promise<Return>) => Promise<Return> }
): (...args: Args) => Promise<Return> {
  return async (...args: Args): Promise<Return> => {
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
export function withValidation<Args extends unknown[], Return>(
  validator: (...args: Args) => { valid: boolean; errors?: string[] },
  handler: (...args: Args) => Promise<Return>
): (...args: Args) => Promise<Return> {
  return async (...args: Args): Promise<Return> => {
    const validation = validator(...args);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
    }
    return handler(...args);
  };
} 