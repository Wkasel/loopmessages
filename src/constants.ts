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
 * Event names for different services
 */
export const EVENTS = {
  // Message service events
  MESSAGE: {
    SEND_START: 'send_start',
    SEND_SUCCESS: 'send_success',
    SEND_ERROR: 'send_error',
    AUTH_START: 'auth_start',
    AUTH_SUCCESS: 'auth_success',
    AUTH_ERROR: 'auth_error',
    PARAM_VALIDATION_FAIL: 'param_validation_fail',
  },

  // Status service events
  STATUS: {
    STATUS_CHANGE: 'status_change',
    STATUS_CHECK: 'status_check',
    STATUS_ERROR: 'status_error',
    STATUS_TIMEOUT: 'status_timeout',
  },

  // Webhook service events
  WEBHOOK: {
    WEBHOOK_RECEIVED: 'webhook_received',
    WEBHOOK_VERIFIED: 'webhook_verified',
    WEBHOOK_INVALID: 'webhook_invalid',
    WEBHOOK_PARSE_ERROR: 'webhook_parse_error',
    SIGNATURE_ERROR: 'signature_error',
  },
} as const;

/**
 * Valid webhook event types from Loop API
 */
export const WEBHOOK_TYPES = {
  MESSAGE_INBOUND: 'message_inbound',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_FAILED: 'message_failed',
  MESSAGE_SCHEDULED: 'message_scheduled',
  MESSAGE_TIMEOUT: 'message_timeout',
  MESSAGE_REACTION: 'message_reaction',
  GROUP_CREATED: 'group_created',
  CONVERSATION_INITED: 'conversation_inited',
} as const;

/**
 * Valid service types
 */
export const SERVICES = {
  IMESSAGE: 'imessage',
  SMS: 'sms',
} as const;

/**
 * Validation patterns and arrays
 */
export const VALIDATION = {
  /** Valid message effects */
  EFFECTS: [
    'slam',
    'loud',
    'gentle',
    'invisibleInk',
    'echo',
    'spotlight',
    'balloons',
    'confetti',
    'love',
    'lasers',
    'fireworks',
    'shootingStar',
    'celebration',
  ] as const,

  /** Valid message reactions */
  REACTIONS: [
    'love',
    'like',
    'dislike',
    'laugh',
    'exclaim',
    'question',
    '-love',
    '-like',
    '-dislike',
    '-laugh',
    '-exclaim',
    '-question',
  ] as const,

  /** Valid service types */
  SERVICES: ['imessage', 'sms'] as const,

  /** Phone number regex pattern */
  PHONE_REGEX: /^\+[0-9]{5,15}$/,

  /** Email regex pattern */
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  MISSING_CONFIG:
    'Missing required config: loopAuthKey, loopSecretKey, and senderName are required.',
  MISSING_WEBHOOK_SECRET:
    'Missing required config: webhookSecretKey is required for webhook verification',
  INVALID_PHONE: 'Phone number must start with + and contain 5-15 digits',
  INVALID_EMAIL: 'Invalid email format',
  MISSING_TEXT: 'Text is required',
  TEXT_TOO_LONG: (max: number) => `Text exceeds maximum length of ${max} characters`,
  URL_NOT_HTTPS: 'URL must use HTTPS protocol',
  INVALID_URL: 'Invalid URL format',
  TOO_MANY_ATTACHMENTS: (max: number) => `Maximum of ${max} attachments allowed`,
  PASSTHROUGH_TOO_LONG: (max: number) => `Passthrough exceeds maximum length of ${max} characters`,
  INVALID_EFFECT: (valid: readonly string[]) =>
    `Invalid effect. Must be one of: ${valid.join(', ')}`,
  INVALID_REACTION: (valid: readonly string[]) =>
    `Invalid reaction. Must be one of: ${valid.join(', ')}`,
  INVALID_SERVICE: (valid: readonly string[]) =>
    `Invalid service. Must be one of: ${valid.join(', ')}`,
  SMS_NO_EMAIL: 'Cannot send SMS to an email address',
  SMS_NO_GROUP: 'Cannot send SMS to a group',
  SMS_NO_FEATURES: 'SMS does not support subject, effect, or reply_to_id parameters',
  MIN_TIMEOUT: (min: number) => `Timeout must be at least ${min} seconds`,
  MISSING_SIGNATURE: 'Missing webhook signature header',
  INVALID_SIGNATURE: 'Invalid webhook signature',
  WEBHOOK_VERIFICATION_FAILED: 'Failed to verify webhook signature',
  WEBHOOK_MISSING_FIELDS: 'Invalid webhook payload: missing required fields',
  WEBHOOK_INVALID_JSON: 'Invalid webhook payload: invalid JSON',
  MUTUAL_EXCLUSIVE: 'Provide either recipient or group, not both',
  EFFECT_AND_REACTION: 'Cannot use both effect and reaction in the same request',
  AUDIO_NEEDS_URL: 'media_url for audio message',
  REACTION_NEEDS_ID: 'message_id for reaction',
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

  /** Default log level for services */
  LOG_LEVEL: 'info' as const,

  /** Default auto-respond setting for webhooks */
  WEBHOOK_AUTO_RESPOND: true,
};
