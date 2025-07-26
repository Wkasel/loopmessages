import { LoopHttpClient } from '../../src/utils/LoopHttpClient';
import { LoopMessageError } from '../../src/errors/LoopMessageError';
import axios from 'axios';

// Manual mock for axios instead of using jest.mock
jest.mock('axios', () => {
  return {
    create: jest.fn(),
  };
});

describe('LoopHttpClient', () => {
  const testConfig = {
    loopAuthKey: 'test-auth-key',
    loopSecretKey: 'test-secret-key',
    loopAuthSecretKey: 'test-auth-secret-key',
  };

  let httpClient: LoopHttpClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Create a mock axios instance with all the methods we need
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    // Mock the axios.create function
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

    // Create the HTTP client with our test config
    httpClient = new LoopHttpClient(testConfig, 'message');
  });

  describe('initialization', () => {
    test('should create client with default config', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.loop.us/v1',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'x-loop-secret-key': testConfig.loopSecretKey,
          'x-loop-key': testConfig.loopAuthKey,
        },
      });
    });

    test('should set proper headers for message endpoint', () => {
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-loop-secret-key': testConfig.loopSecretKey,
            'x-loop-key': testConfig.loopAuthKey,
          }),
        })
      );
    });
  });

  describe('get method', () => {
    test('should make successful GET request', async () => {
      const mockResponse = { data: { success: true } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await httpClient.get('/test-endpoint');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test-endpoint', { params: undefined });
      expect(result).toEqual(mockResponse.data);
    });

    test('should pass query parameters', async () => {
      const mockResponse = { data: { success: true } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      const params = { id: '123', filter: 'test' };

      const result = await httpClient.get('/test-endpoint', { params });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test-endpoint', { params });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('post method', () => {
    test('should make successful POST request with body', async () => {
      const mockResponse = { data: { id: '123', success: true } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      const body = { name: 'Test', value: 123 };

      const result = await httpClient.post('/test-endpoint', body);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test-endpoint', body);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('error handling', () => {
    test('should handle API errors and convert to LoopMessageError', async () => {
      const apiError = {
        response: {
          status: 400,
          data: {
            error: {
              code: 'INVALID_REQUEST',
              message: 'Invalid request parameters',
            },
          },
        },
      };
      mockAxiosInstance.get.mockRejectedValue(apiError);

      await expect(httpClient.get('/test-endpoint')).rejects.toThrow(LoopMessageError);
      await expect(httpClient.get('/test-endpoint')).rejects.toThrow('Invalid request parameters');
    });

    test('should handle 404 errors correctly', async () => {
      const apiError = {
        response: {
          status: 404,
          data: {
            error: {
              code: 'NOT_FOUND',
              message: 'Resource not found',
            },
          },
        },
      };
      mockAxiosInstance.get.mockRejectedValue(apiError);

      await expect(httpClient.get('/test-endpoint')).rejects.toThrow(LoopMessageError);
      await expect(httpClient.get('/test-endpoint')).rejects.toThrow('Resource not found');
    });

    test('should handle network errors correctly', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(httpClient.get('/test-endpoint')).rejects.toThrow(LoopMessageError);
      await expect(httpClient.get('/test-endpoint')).rejects.toThrow('Network Error');
    });
  });
});
