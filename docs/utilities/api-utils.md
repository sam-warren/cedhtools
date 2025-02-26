# API Utilities Documentation

This document describes the type-safe utility functions used in the service layer to simplify data fetching, error handling, caching, validation, and database operations.

## Higher-Order Function Utilities

The service layer uses a collection of higher-order functions to reduce repetition and improve maintainability while ensuring type safety.

### Data Fetching Utilities

#### `createMockListFetcher<T>`

Creates a function that fetches a list of items from mock data.

```typescript
/**
 * Creates a function that fetches a list of items from mock data
 * @param mockData The mock data array to use
 * @returns A function that returns a Promise resolving to the mock data
 */
export async function createMockListFetcher<T>(mockData: T[]) {
  return () => Promise.resolve(mockData);
}
```

#### `createMockItemFetcher<T>`

Creates a function that fetches a single item by ID from mock data.

```typescript
/**
 * Creates a function that fetches a single item by ID from mock data
 * @param mockData The mock data array to search
 * @param idField The field name to use as the ID (defaults to 'id')
 * @returns A function that takes an ID and returns a Promise resolving to the item or null
 */
export async function createMockItemFetcher<T>(
  mockData: T[],
  idField: keyof T = "id" as keyof T
) {
  return (id: string) => {
    const item = mockData.find(
      (item) => (item[idField] as unknown as string) === id
    );
    return Promise.resolve(item || null);
  };
}
```

#### `createMockItemWithDetailsFetcher<T, R>`

Creates a function that fetches a single item by ID and enhances it with additional data.

```typescript
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
  idField: keyof T = "id" as keyof T
) {
  return (id: string) => {
    const item = mockData.find(
      (item) => (item[idField] as unknown as string) === id
    );
    if (!item) return Promise.resolve(null);
    return Promise.resolve(enhancer(item));
  };
}
```

#### `createRelatedItemsFetcher<T, P extends string>`

Creates a function that fetches data related to a specific parent item.

```typescript
/**
 * Creates a function that fetches data related to a specific parent item
 * @param parentIdParam The name of the parent ID parameter
 * @param mockDataGenerator A function that generates mock data based on the parent ID
 * @returns A function that takes a parent ID and returns a Promise resolving to the related data
 */
export async function createRelatedItemsFetcher<T, P extends string>(
  parentIdParam: P,
  mockDataGenerator: (parentId: string) => T
) {
  return (parentId: string) => Promise.resolve(mockDataGenerator(parentId));
}
```

### Error Handling and Caching

#### `withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>`

Safely handles API requests with proper error handling while preserving the original function signature.

```typescript
/**
 * Safely handles API requests with proper error handling
 * @param fn The async function to execute
 * @returns A wrapped function with error handling
 */
export async function withErrorHandling<
  T extends (...args: unknown[]) => Promise<unknown>
>(fn: T): Promise<T> {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return (await fn(...args)) as ReturnType<T>;
    } catch (error) {
      console.error("Service error:", error);
      throw error;
    }
  }) as T;
}
```

#### `withCache<T extends (...args: unknown[]) => Promise<unknown>>`

Adds caching to a service function with a configurable TTL while preserving type safety.

```typescript
/**
 * Adds caching to a service function
 * @param fn The function to cache
 * @param ttlMs Time to live in milliseconds (default: 5 minutes)
 * @returns A cached version of the function
 */
export async function withCache<
  T extends (...args: unknown[]) => Promise<unknown>
>(fn: T, ttlMs: number = 5 * 60 * 1000): Promise<T> {
  const cache = new Map<string, { data: unknown; timestamp: number }>();

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttlMs) {
      return cached.data as ReturnType<T>;
    }

    const result = await fn(...args);
    cache.set(key, { data: result, timestamp: Date.now() });
    return result as ReturnType<T>;
  }) as T;
}
```

### Database Operations and Validation

#### `withTransaction<Args extends unknown[], Return, DB>`

Creates a transaction handler for database operations with proper typing.

```typescript
/**
 * Creates a transaction handler for database operations
 * @param handler The function that performs the database operation
 * @param db The database client
 * @returns A function that executes the handler within a transaction
 */
export async function withTransaction<Args extends unknown[], Return, DB>(
  handler: (tx: DB, ...args: Args) => Promise<Return>,
  db: { transaction: (fn: (tx: DB) => Promise<Return>) => Promise<Return> }
): Promise<(...args: Args) => Promise<Return>> {
  return async (...args: Args): Promise<Return> => {
    return db.transaction(async (tx) => {
      return handler(tx, ...args);
    });
  };
}
```

#### `withValidation<T extends (...args: unknown[]) => Promise<unknown>>`

Creates a function that validates input data before processing with type safety.

```typescript
/**
 * Creates a function that validates input data before processing
 * @param validator The validation function
 * @param handler The handler function to execute if validation passes
 * @returns A function that validates input and then executes the handler
 */
export async function withValidation<
  T extends (...args: unknown[]) => Promise<unknown>
>(
  validator: (...args: Parameters<T>) => { valid: boolean; errors?: string[] },
  handler: T
): Promise<T> {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const validation = validator(...args);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors?.join(", ")}`);
    }
    return handler(...args) as ReturnType<T>;
  }) as T;
}
```

## Type Safety Features

These utilities employ several TypeScript features to ensure type safety:

1. **Generic Type Parameters**: All utilities use generic type parameters to preserve the original function signatures.
2. **TypeScript's Utility Types**: Makes use of `Parameters<T>` and `ReturnType<T>` to safely preserve parameter and return types.
3. **Type Constraints**: Uses `extends` clauses to properly constrain generic types (`Args extends unknown[]`).
4. **Safe Type Assertions**: Type assertions (`as ReturnType<T>`) are used judiciously only where necessary.
5. **Unknown vs Any**: Uses the safer `unknown` type instead of `any` to prevent type safety bypassing.

## Usage Examples

### Basic Data Fetching

```typescript
// Create a simple list fetcher for players
export const getPlayers = withErrorHandling(
  withCache(createMockListFetcher<Player>(mockPlayerData))
);

// Usage
const players = await getPlayers();
```

### Caching with Custom TTL

```typescript
// Cache frequently accessed data with a 30-minute TTL
export const getFrequentlyAccessedData = withErrorHandling(
  withCache(
    async () => {
      // Expensive data fetching operation
      return expensiveDataFetch();
    },
    30 * 60 * 1000 // 30 minutes in milliseconds
  )
);
```

### Transaction Handling

```typescript
// Define a transaction handler for creating an order
export const createOrder = withErrorHandling(async (orderData: OrderData) => {
  // Use the withTransaction utility
  const transactionHandler = await withTransaction(
    async (tx, data: OrderData) => {
      const order = await tx.orders.create({ data: { ...data } });
      await tx.inventory.update({
        where: { id: data.productId },
        data: { stock: { decrement: data.quantity } },
      });
      return order;
    },
    prisma // Your database client
  );

  return transactionHandler(orderData);
});
```

### Validation with Error Handling

```typescript
// Create a validation function
const validateRegistration = (
  data: RegisterParams
): { valid: boolean; errors?: string[] } => {
  const errors: string[] = [];

  if (!data.email) errors.push("Email is required");
  if (!data.password) errors.push("Password is required");
  if (data.password && data.password.length < 8)
    errors.push("Password must be at least 8 characters");

  return {
    valid: errors.length === 0,
    errors: errors.length ? errors : undefined,
  };
};

// Create a service function with validation
export const registerUser = withErrorHandling(
  withValidation(validateRegistration, async (data: RegisterParams) => {
    // Implementation
    return { success: true, userId: "new-user-id" };
  })
);
```
