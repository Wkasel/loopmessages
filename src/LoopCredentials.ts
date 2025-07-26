/**
 * LoopCredentials.ts - Unified credential and configuration interfaces
 */

/**
 * Base credentials interface for all Loop API services
 */
export interface LoopCredentials {
  /** Authorization Key used for all API requests */
  loopAuthKey: string;

  /** Secret Key for sending messages and checking status */
  loopSecretKey: string;

  /** Optional Secret Key for authentication requests */
  loopAuthSecretKey?: string;

  /** Optional base API URL, defaults to production URL */
  baseApiUrl?: string;
}

/**
 * Configuration for the LoopMessageService
 */
export interface MessageServiceConfig extends LoopCredentials {
  /** Sender name (email) for message sending */
  senderName: string;

  /** Optional separate API host for authentication requests */
  loopApiAuthHost?: string;

  /** Optional logging level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'none';
}

/**
 * Configuration for the MessageStatusChecker
 */
export interface StatusServiceConfig extends LoopCredentials {
  // Status-specific configurations can be added here
  /** Optional logging level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'none';
}

/**
 * Configuration for the WebhookHandler
 */
export interface WebhookConfig extends LoopCredentials {
  /** Secret key for verifying webhook signatures */
  webhookSecretKey?: string;

  /** Optional path for webhook endpoint */
  webhookPath?: string;

  /** Optional logging level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'none';
}

/**
 * Unified SDK configuration that can be used to initialize all services
 */
export interface LoopSdkConfig extends LoopCredentials {
  /** Sender name for message sending */
  senderName?: string;

  /** Separate auth host */
  loopApiAuthHost?: string;

  /** Webhook configuration */
  webhook?: {
    secretKey?: string;
    path?: string;
  };

  /** Logging level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'none';
}
