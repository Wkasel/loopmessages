/**
 * Centralized constants file for Loop API SDK
 */

/**
 * API Endpoints and URLs
 */
export const API = {
  /** Base URL for API requests */
  BASE_URL: 'https://server.loopmessage.com',

  /** API Endpoints */
  ENDPOINTS: {
    /** Message sending endpoint */
    SEND: '/api/v1/message/send/',

    /** Message status endpoint */
    STATUS: '/api/v1/message/status/',

    /** Authentication request endpoint */
    AUTH: '/api/v1/auth/initiate/',

    /** Webhooks endpoint - used for verification */
    WEBHOOK: '/api/v1/webhook/',
  },
};

/**
 * Request retry configuration
 */
export const RETRY = {
  /** Maximum number of retry attempts */
  MAX_RETRIES: process.env.NODE_ENV === 'test' ? 2 : 5,

  /** Base delay in milliseconds for exponential backoff */
  BASE_DELAY: process.env.NODE_ENV === 'test' ? 100 : 500,

  /** Codes that should not be retried */
  NON_RETRYABLE_CODES: [400, 401, 403, 404],
};

/**
 * Message limitations and constraints
 */
export const LIMITS = {
  /** Maximum length of message text */
  MAX_TEXT_LENGTH: 10000,

  /** Maximum number of attachments */
  MAX_ATTACHMENTS: 3,

  /** Maximum length of passthrough data */
  MAX_PASSTHROUGH_LENGTH: 1000,

  /** Minimum timeout in seconds */
  MIN_TIMEOUT: 5,
};

/**
 * Message status types
 */
export const MESSAGE_STATUS = {
  /** Message is being processed */
  PROCESSING: 'processing',

  /** Message is scheduled for delivery */
  SCHEDULED: 'scheduled',

  /** Message delivery failed */
  FAILED: 'failed',

  /** Message delivered successfully */
  SENT: 'sent',

  /** Message delivery timed out */
  TIMEOUT: 'timeout',

  /** Status unknown or not determined */
  UNKNOWN: 'unknown',
} as const;

/**
 * Message effect types
 */
export const MESSAGE_EFFECT = {
  /** Slam effect */
  SLAM: 'slam',

  /** Loud effect */
  LOUD: 'loud',

  /** Gentle effect */
  GENTLE: 'gentle',

  /** Invisible ink effect */
  INVISIBLE_INK: 'invisibleInk',

  /** Echo effect */
  ECHO: 'echo',

  /** Spotlight effect */
  SPOTLIGHT: 'spotlight',

  /** Balloons effect */
  BALLOONS: 'balloons',

  /** Confetti effect */
  CONFETTI: 'confetti',

  /** Love effect */
  LOVE: 'love',

  /** Lasers effect */
  LASERS: 'lasers',

  /** Fireworks effect */
  FIREWORKS: 'fireworks',

  /** Shooting star effect */
  SHOOTING_STAR: 'shootingStar',

  /** Celebration effect */
  CELEBRATION: 'celebration',
} as const;

/**
 * Message reaction types
 */
export const MESSAGE_REACTION = {
  /** Add love reaction */
  LOVE: 'love',

  /** Add like (thumbs up) reaction */
  LIKE: 'like',

  /** Add dislike (thumbs down) reaction */
  DISLIKE: 'dislike',

  /** Add laugh reaction */
  LAUGH: 'laugh',

  /** Add exclamation reaction */
  EXCLAIM: 'exclaim',

  /** Add question reaction */
  QUESTION: 'question',

  /** Remove love reaction */
  REMOVE_LOVE: '-love',

  /** Remove like reaction */
  REMOVE_LIKE: '-like',

  /** Remove dislike reaction */
  REMOVE_DISLIKE: '-dislike',

  /** Remove laugh reaction */
  REMOVE_LAUGH: '-laugh',

  /** Remove exclamation reaction */
  REMOVE_EXCLAIM: '-exclaim',

  /** Remove question reaction */
  REMOVE_QUESTION: '-question',
} as const;

/**
 * Default configuration values
 */
export const DEFAULTS = {
  /** Default polling interval for status checks (in ms) */
  STATUS_POLL_INTERVAL: 2000,

  /** Default maximum attempts for status polling */
  STATUS_MAX_ATTEMPTS: 10,

  /** Default timeout for waiting for a status change (in ms) */
  STATUS_TIMEOUT: 30000,
};
