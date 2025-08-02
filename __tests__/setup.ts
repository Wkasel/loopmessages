/**
 * Jest test setup file
 */

// Make TypeScript recognize Jest globals
import { expect, jest } from '@jest/globals';

// Mock axios globally to prevent real HTTP requests during tests
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.reject(new Error('Unmocked axios call in tests'))),
      post: jest.fn(() => Promise.reject(new Error('Unmocked axios call in tests'))),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
  },
}));

// Extend Jest matchers if needed
expect.extend({
  // Add custom matchers here if needed
});

// Set default Jest timeout
jest.setTimeout(10000);

// Making this a module
export {};
