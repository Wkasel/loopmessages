# LoopMessage SDK Refactoring Plan

## 1. Unified Configuration

The most obvious duplication is in configuration objects:

```typescript
// Current approach - separate configs
interface LoopMessageServiceConfig {
  loopAuthKey: string;
  loopSecretKey: string;
  loopAuthSecretKey?: string;
  senderName: string;
  // ...
}

interface StatusCredentials {
  loopAuthKey: string;
  loopSecretKey: string;
  baseApiUrl?: string;
}

// Proposed approach - unified base config
interface LoopCredentials {
  loopAuthKey: string;
  loopSecretKey: string;
  loopAuthSecretKey?: string;
  baseApiUrl?: string;
}

// Service-specific configs extend the base
interface MessageServiceConfig extends LoopCredentials {
  senderName: string;
  // other message-specific config
}
```

## 2. HTTP Client Abstraction

Each service implements its own Axios usage pattern:

```typescript
// Create a shared HTTP client factory
class LoopHttpClient {
  static create(credentials: LoopCredentials, endpointType: 'message'|'status'|'auth') {
    const baseUrl = credentials.baseApiUrl || 'https://server.loopmessage.com';
    
    // Configure headers based on endpoint type
    const headers = {
      Authorization: credentials.loopAuthKey,
      // Different endpoints need different headers
    };
    
    return axios.create({
      baseURL: baseUrl,
      headers
    });
  }
  
  // Add shared retry logic here
  static async requestWithRetry(request, options) { /* ... */ }
}
```

## 3. Retry Logic Centralization

The retry logic with exponential backoff is duplicated across services:

```typescript
// In a shared utility file
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    nonRetryableErrors?: Array<number | string>;
    onRetry?: (attempt: number, delay: number) => void;
  } = {}
): Promise<T> {
  // Implement the shared retry pattern
}
```

## 4. Error Handling Standardization

Create a consistent pattern for error handling:

```typescript
// Error factory
export class ErrorFactory {
  static createFromAxiosError(error: AxiosError, context: string): LoopMessageError {
    // Standardized error creation
  }
  
  static createFromApiResponse(response: any, context: string): LoopMessageError {
    // Handle API errors consistently
  }
}
```

## 5. Type Definition Consolidation

Several types are defined in multiple places or have inconsistent naming:

- Standardize naming patterns (e.g., `MessageStatus` vs `LoopMessageStatus`)
- Create a single source of truth for shared types
- Consider generating TypeScript types from an API schema if available

## 6. Validator Functions

Extract common validation logic:

```typescript
// Shared validators
export const Validators = {
  isValidPhoneNumber: (phone: string): boolean => { /* ... */ },
  isValidEmail: (email: string): boolean => { /* ... */ },
  isValidAttachment: (url: string): boolean => { /* ... */ },
  // ...
}
```

## 7. Constants Management

Create a centralized constants file:

```typescript
// constants.ts
export const API = {
  BASE_URL: 'https://server.loopmessage.com',
  ENDPOINTS: {
    SEND: '/api/v1/message/send/',
    AUTH: '/api/v1/auth/',
    STATUS: '/api/v1/message/status/'
  }
};

export const LIMITS = {
  MAX_TEXT_LENGTH: 10000,
  MAX_ATTACHMENTS: 3,
  MAX_RETRIES: 3,
  // ...
};
```

## 8. Logging Abstraction

Add a configurable logging interface:

```typescript
interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

// Default implementation (console)
class ConsoleLogger implements Logger {
  // ...
}

// Allow users to inject their own logger
interface SDKConfig {
  logger?: Logger;
  // ...
}
```

## 9. Event Emitter Commonality

Both the WebhookHandler and ConversationService use EventEmitter patterns - standardize this approach:

```typescript
// Create a base class for event-emitting services
abstract class EventService extends EventEmitter {
  protected emitEvent<T>(event: string, data: T): void {
    // Add debugging, logging, etc.
    this.emit(event, data);
  }
}
```

## 10. Integration Testing Infrastructure

Create a shared testing infrastructure that all services can use:

```typescript
export class TestEnvironment {
  static createMockServer() { /* ... */ }
  static getMockCredentials() { /* ... */ }
  static createTestMessage() { /* ... */ }
}
```
