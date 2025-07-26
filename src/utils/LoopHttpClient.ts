import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type { LoopCredentials } from '../LoopCredentials.js';
import { LoopMessageError } from '../errors/LoopMessageError.js';
import { retryWithExponentialBackoff } from './retry.js';

/**
 * Endpoint types for the Loop API
 */
export type LoopEndpointType = 'message' | 'status' | 'auth' | 'webhook';

/**
 * Additional request configuration specific to Loop API
 */
export interface LoopRequestConfig extends AxiosRequestConfig {
  /** Whether to retry the request on failure */
  shouldRetry?: boolean;
  /** Maximum number of retries */
  maxRetries?: number;
  /** Base delay for exponential backoff in ms */
  baseDelay?: number;
  /** Error codes that should not trigger a retry */
  nonRetryableErrorCodes?: number[];
}

/**
 * Shared HTTP client for all Loop API services
 */
export class LoopHttpClient {
  private readonly credentials: LoopCredentials;
  private readonly client: AxiosInstance;

  /**
   * Creates a new HTTP client for a specific Loop API endpoint type
   *
   * @param credentials - The Loop API credentials
   * @param endpointType - The type of endpoint (determines headers)
   */
  constructor(credentials: LoopCredentials, endpointType: LoopEndpointType) {
    this.credentials = credentials;

    const baseUrl = credentials.baseApiUrl || 'https://server.loopmessage.com';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: credentials.loopAuthKey,
    };

    // Configure endpoint-specific headers
    switch (endpointType) {
      case 'message':
        headers['Loop-Secret-Key'] = credentials.loopSecretKey;
        break;
      case 'status':
        headers['Loop-Secret-Key'] = credentials.loopSecretKey;
        break;
      case 'auth':
        headers['Auth-Secret-Key'] = credentials.loopAuthSecretKey || '';
        break;
      // Webhook doesn't need additional headers
    }

    this.client = axios.create({
      baseURL: baseUrl,
      headers,
    });
  }

  /**
   * Perform a GET request with retry logic
   *
   * @param url - The URL to request
   * @param config - Additional request configuration
   * @returns Promise resolving to the response data
   */
  async get<T = any>(url: string, config?: LoopRequestConfig): Promise<T> {
    const { shouldRetry = true, maxRetries = 3, baseDelay = 500, ...axiosConfig } = config || {};

    if (!shouldRetry) {
      const response = await this.client.get<T>(url, axiosConfig);
      return response.data;
    }

    // Using retry utility for retryable requests
    return retryWithExponentialBackoff(
      async () => {
        const response = await this.client.get<T>(url, axiosConfig);
        return response.data;
      },
      {
        maxRetries,
        baseDelay,
        nonRetryableErrors: config?.nonRetryableErrorCodes || [400, 401, 403, 404],
        onError: (error: Error | AxiosError) => this.handleRequestError(error),
      }
    );
  }

  /**
   * Perform a POST request with retry logic
   *
   * @param url - The URL to request
   * @param data - The data to send
   * @param config - Additional request configuration
   * @returns Promise resolving to the response data
   */
  async post<T = any>(url: string, data?: any, config?: LoopRequestConfig): Promise<T> {
    const { shouldRetry = true, maxRetries = 3, baseDelay = 500, ...axiosConfig } = config || {};

    if (!shouldRetry) {
      const response = await this.client.post<T>(url, data, axiosConfig);
      return response.data;
    }

    // Using retry utility for retryable requests
    return retryWithExponentialBackoff(
      async () => {
        const response = await this.client.post<T>(url, data, axiosConfig);
        return response.data;
      },
      {
        maxRetries,
        baseDelay,
        nonRetryableErrors: config?.nonRetryableErrorCodes || [400, 401, 403, 404],
        onError: (error: Error | AxiosError) => this.handleRequestError(error),
      }
    );
  }

  /**
   * Handle and transform request errors
   *
   * @param error - The error to handle
   * @throws LoopMessageError with appropriate details
   */
  private handleRequestError(error: Error | AxiosError): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorData = error.response?.data as any;

      // Handle specific error cases
      if (status === 404) {
        throw new LoopMessageError({
          message: 'Resource not found',
          code: 404,
          cause: errorData?.message || 'The requested resource does not exist',
        });
      }

      if (status === 401 || status === 403) {
        throw new LoopMessageError({
          message: 'Authentication failed',
          code: status,
          cause: 'Invalid API credentials',
        });
      }

      if (status === 400) {
        throw new LoopMessageError({
          message: 'Invalid request',
          code: 400,
          cause: errorData?.message || 'The request parameters are invalid',
        });
      }

      // Handle other API errors
      throw new LoopMessageError({
        message: errorData?.message || 'API request failed',
        code: errorData?.code || status,
        cause: error.message,
      });
    }

    // For non-Axios errors
    throw new LoopMessageError({
      message: 'Request failed',
      code: 500,
      cause: error.message,
    });
  }
}
