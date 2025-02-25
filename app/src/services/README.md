# Service Layer Architecture

This directory contains the service layer for the application, which handles data fetching, processing, and business logic. The service layer has been refactored to use higher-order functions and utility patterns to reduce repetition and improve maintainability.

## Core Utilities (`apiUtils.ts`)

The `apiUtils.ts` file contains higher-order functions and utilities that can be used across different service modules:

### Data Fetching Utilities

- `createMockListFetcher<T>`: Creates a function that fetches a list of items from mock data.
- `createMockItemFetcher<T>`: Creates a function that fetches a single item by ID from mock data.
- `createMockItemWithDetailsFetcher<T, R>`: Creates a function that fetches a single item by ID and enhances it with additional data.
- `createRelatedItemsFetcher<T, P>`: Creates a function that fetches data related to a specific parent item.

### Error Handling and Caching

- `withErrorHandling<Args, Return>`: Wraps a function with error handling logic.
- `withCache<Args, Return>`: Adds caching to a service function with a configurable TTL.

### Database and Validation

- `withTransaction<Args, Return, DB>`: Creates a transaction handler for database operations.
- `withValidation<Args, Return>`: Creates a function that validates input data before processing.

## Service Modules

Each service module focuses on a specific domain and uses the utility functions to implement its functionality:

- `players.ts`: Services for player data and statistics.
- `tournaments.ts`: Services for tournament data and statistics.
- `commanders.ts`: Services for commander data, statistics, and related information.
- `auth.ts`: Authentication and user management services.
- `email.ts`: Email sending services.

## Usage Examples

### Basic Data Fetching

```typescript
// Create a simple list fetcher
export const getPlayers = withErrorHandling(
  withCache(
    createMockListFetcher<Player>(mockPlayerData)
  )
);
```

### Fetching with Details

```typescript
// Create a function to enhance a player with additional details
const enhancePlayerWithDetails = (player: Player): PlayerDetails => ({
  ...player,
  // Add additional details here
});

// Create a fetcher that enhances the data
export const getPlayerById = withErrorHandling(
  withCache(
    createMockItemWithDetailsFetcher<Player, PlayerDetails>(
      mockPlayerData,
      enhancePlayerWithDetails
    )
  )
);
```

### Validation and Transactions

```typescript
// Create a validation function
const validateRegistration = (data: RegisterParams): { valid: boolean; errors?: string[] } => {
  // Validation logic here
};

// Create a service function with validation and transaction handling
export const registerUser = withErrorHandling(
  withValidation(
    validateRegistration,
    async (data: RegisterParams) => {
      // Implementation using transactions
      return await prisma.$transaction(async (tx) => {
        // Database operations here
      });
    }
  )
);
```

## Benefits

- **Reduced Repetition**: Common patterns are abstracted into reusable functions.
- **Consistent Error Handling**: All service functions use the same error handling approach.
- **Automatic Caching**: Frequently accessed data is cached to improve performance.
- **Type Safety**: All utilities are fully typed with TypeScript generics.
- **Testability**: Functions are composed of smaller, more testable units.
- **Maintainability**: Changes to common patterns only need to be made in one place. 