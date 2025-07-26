# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm install` - Install dependencies
- `npm run build` - Compile TypeScript to JavaScript (outputs to dist/)
- `npm run lint` - Run ESLint on source files
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- Run a single test file: `npm test -- path/to/test.test.ts`

### Before Publishing
- `npm run prepublishOnly` - Runs tests and linting (automatically called before npm publish)

## Architecture Overview

This is a TypeScript SDK for the LoopMessage API that enables sending iMessages and SMS programmatically. The codebase follows these architectural patterns:

### Core Design
- **Event-Driven Architecture**: All services extend `EventService` (src/utils/EventService.ts) which provides event emission capabilities
- **Service Layer Pattern**: Separate service classes handle different API concerns:
  - `LoopMessageService` - Message sending operations
  - `MessageStatusChecker` - Status polling and tracking
  - `WebhookHandler` - Webhook event processing
- **Unified SDK Interface**: `LoopSdk` class aggregates all services into a single entry point

### Key Components
1. **HTTP Client** (src/utils/LoopHttpClient.ts): Wraps axios with authentication, retry logic, and error handling
2. **Error Handling**: Custom `LoopMessageError` class with retry support using exponential backoff
3. **Type System**: Comprehensive TypeScript types in src/types.ts define all API contracts
4. **Constants**: API endpoints, limits, and enums centralized in src/constants.ts

### Message Flow
1. Messages are sent via `LoopMessageService.send()` which returns a message ID
2. `MessageStatusChecker` polls the status endpoint to track delivery progress
3. Events are emitted at each state change (sent, delivered, failed, etc.)
4. Webhooks can be configured to receive real-time updates

### Testing Strategy
- Unit tests use Jest with ts-jest for TypeScript support
- Tests mock the HTTP client to avoid external API calls
- Test files mirror the source structure in __tests__/

## Important Notes
- This is an ES Module project - use `import` syntax, not `require`
- All async operations return Promises and emit events
- The SDK supports both iMessage-specific features (tapbacks, effects) and standard SMS
- Authentication flow is required for iMessage sending (see src/LoopMessageConversation.ts)