/**
 * Jest test setup file
 */

// Make TypeScript recognize Jest globals
import { expect, jest } from '@jest/globals';

// Extend Jest matchers if needed
expect.extend({
  // Add custom matchers here if needed
});

// Set default Jest timeout
jest.setTimeout(10000);

// Making this a module
export {};
