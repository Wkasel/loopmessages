/**
 * Utility functions for validating Loop API parameters
 */
import { LIMITS, VALIDATION, ERROR_MESSAGES } from '../constants.js';
import { LoopMessageError } from '../errors/LoopMessageError.js';
import type { MessageEffect, MessageReaction } from '../types.js';

/**
 * Validate recipient parameter (phone number or email)
 *
 * @param recipient - Phone number or email to validate
 * @returns True if valid, throws error if invalid
 */
export function validateRecipient(recipient?: string): boolean {
  if (!recipient) {
    return false;
  }

  // Check for email format
  if (recipient.includes('@')) {
    return validateEmail(recipient);
  }

  // Otherwise validate as phone number
  return validatePhoneNumber(recipient);
}

/**
 * Validate phone number format
 *
 * @param phone - Phone number to validate
 * @returns True if valid, throws error if invalid
 */
export function validatePhoneNumber(phone: string): boolean {
  // Basic validation - should start with + and contain only digits
  // Loop API has more complex validation on their server side
  if (!VALIDATION.PHONE_REGEX.test(phone)) {
    throw LoopMessageError.invalidParamError('recipient', ERROR_MESSAGES.INVALID_PHONE);
  }

  return true;
}

/**
 * Validate email format
 *
 * @param email - Email to validate
 * @returns True if valid, throws error if invalid
 */
export function validateEmail(email: string): boolean {
  // Simple email validation - Loop API has more complex validation
  if (!VALIDATION.EMAIL_REGEX.test(email)) {
    throw LoopMessageError.invalidParamError('recipient', ERROR_MESSAGES.INVALID_EMAIL);
  }

  return true;
}

/**
 * Validate message text
 *
 * @param text - Message text to validate
 * @returns True if valid, throws error if invalid
 */
export function validateMessageText(text?: string): boolean {
  if (!text || text.trim() === '') {
    throw LoopMessageError.missingParamError(ERROR_MESSAGES.MISSING_TEXT);
  }

  if (text.length > LIMITS.MAX_TEXT_LENGTH) {
    throw LoopMessageError.invalidParamError(
      'text',
      ERROR_MESSAGES.TEXT_TOO_LONG(LIMITS.MAX_TEXT_LENGTH)
    );
  }

  return true;
}

/**
 * Validate URL format
 *
 * @param url - URL to validate
 * @param paramName - Parameter name for error reporting
 * @returns True if valid, throws error if invalid
 */
export function validateUrl(url: string, paramName: string): boolean {
  try {
    new URL(url);

    // Check if URL uses HTTPS
    if (!url.startsWith('https://')) {
      throw LoopMessageError.invalidParamError(paramName, ERROR_MESSAGES.URL_NOT_HTTPS);
    }

    return true;
  } catch (error) {
    if (error instanceof LoopMessageError) {
      throw error;
    }

    throw LoopMessageError.invalidParamError(paramName, ERROR_MESSAGES.INVALID_URL);
  }
}

/**
 * Validate attachment URLs
 *
 * @param attachments - Array of attachment URLs
 * @returns True if valid, throws error if invalid
 */
export function validateAttachments(attachments?: string[]): boolean {
  if (!attachments || attachments.length === 0) {
    return true;
  }

  if (attachments.length > LIMITS.MAX_ATTACHMENTS) {
    throw LoopMessageError.invalidParamError(
      'attachments',
      ERROR_MESSAGES.TOO_MANY_ATTACHMENTS(LIMITS.MAX_ATTACHMENTS)
    );
  }

  // Validate each attachment URL
  attachments.forEach(url => validateUrl(url, 'attachments'));

  return true;
}

/**
 * Validate passthrough data
 *
 * @param passthrough - Passthrough data to validate
 * @returns True if valid, throws error if invalid
 */
export function validatePassthrough(passthrough?: string): boolean {
  if (!passthrough) {
    return true;
  }

  if (passthrough.length > LIMITS.MAX_PASSTHROUGH_LENGTH) {
    throw LoopMessageError.invalidParamError(
      'passthrough',
      ERROR_MESSAGES.PASSTHROUGH_TOO_LONG(LIMITS.MAX_PASSTHROUGH_LENGTH)
    );
  }

  return true;
}

/**
 * Validate message effect
 *
 * @param effect - Effect to validate
 * @returns True if valid, throws error if invalid
 */
export function validateMessageEffect(effect?: MessageEffect): boolean {
  if (!effect) {
    return true;
  }

  if (!VALIDATION.EFFECTS.includes(effect as any)) {
    throw LoopMessageError.invalidParamError(
      'effect',
      ERROR_MESSAGES.INVALID_EFFECT(VALIDATION.EFFECTS)
    );
  }

  return true;
}

/**
 * Validate message reaction
 *
 * @param reaction - Reaction to validate
 * @returns True if valid, throws error if invalid
 */
export function validateMessageReaction(reaction?: MessageReaction): boolean {
  if (!reaction) {
    return true;
  }

  if (!VALIDATION.REACTIONS.includes(reaction as any)) {
    throw LoopMessageError.invalidParamError(
      'reaction',
      ERROR_MESSAGES.INVALID_REACTION(VALIDATION.REACTIONS)
    );
  }

  return true;
}

/**
 * Validate service type
 *
 * @param service - Service type to validate
 * @returns True if valid, throws error if invalid
 */
export function validateService(service?: string): boolean {
  if (!service) {
    return true;
  }

  if (!VALIDATION.SERVICES.includes(service as any)) {
    throw LoopMessageError.invalidParamError(
      'service',
      ERROR_MESSAGES.INVALID_SERVICE(VALIDATION.SERVICES)
    );
  }

  return true;
}

// -----------------------------------------------------------------------------
// Phone Number Utilities
// -----------------------------------------------------------------------------

/**
 * Check if a string looks like a phone number (starts with + and has digits)
 * This is a non-throwing version for checking before sending
 *
 * @param value - String to check
 * @returns True if it looks like a phone number format
 * @example
 * ```typescript
 * import { isPhoneNumber } from 'loopmessage-sdk';
 *
 * if (isPhoneNumber('+1234567890')) {
 *   console.log('Valid phone format');
 * }
 * ```
 */
export function isPhoneNumber(value: string): boolean {
  return VALIDATION.PHONE_REGEX.test(value);
}

/**
 * Check if a string looks like an email address
 * This is a non-throwing version for checking before sending
 *
 * @param value - String to check
 * @returns True if it looks like an email format
 * @example
 * ```typescript
 * import { isEmail } from 'loopmessage-sdk';
 *
 * if (isEmail('user@example.com')) {
 *   console.log('Valid email format');
 * }
 * ```
 */
export function isEmail(value: string): boolean {
  return VALIDATION.EMAIL_REGEX.test(value);
}

/**
 * Format a phone number for the Loop API by ensuring it has the + prefix
 *
 * @param phone - Phone number to format
 * @returns Formatted phone number with + prefix
 * @throws {LoopMessageError} If the phone number format is invalid
 * @example
 * ```typescript
 * import { formatPhoneNumber } from 'loopmessage-sdk';
 *
 * const formatted = formatPhoneNumber('1234567890'); // Returns '+1234567890'
 * const alreadyFormatted = formatPhoneNumber('+1234567890'); // Returns '+1234567890'
 * ```
 */
export function formatPhoneNumber(phone: string): string {
  // Remove any spaces, dashes, or parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Add + if not present
  const withPlus = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;

  // Validate the result
  validatePhoneNumber(withPlus);

  return withPlus;
}

/**
 * Get the country code from a phone number
 *
 * @param phone - Phone number with country code
 * @returns Country code (e.g., '1' for US/Canada, '44' for UK)
 * @throws {LoopMessageError} If the phone number format is invalid
 * @example
 * ```typescript
 * import { getCountryCode } from 'loopmessage-sdk';
 *
 * const code = getCountryCode('+1234567890'); // Returns '1'
 * const ukCode = getCountryCode('+447700900123'); // Returns '44'
 * ```
 */
export function getCountryCode(phone: string): string {
  validatePhoneNumber(phone);

  // Remove the + and extract likely country codes
  const digits = phone.slice(1);

  // Common country code patterns
  if (digits.startsWith('1')) return '1'; // US/Canada
  if (digits.startsWith('44')) return '44'; // UK
  if (digits.startsWith('33')) return '33'; // France
  if (digits.startsWith('49')) return '49'; // Germany
  if (digits.startsWith('39')) return '39'; // Italy
  if (digits.startsWith('34')) return '34'; // Spain
  if (digits.startsWith('81')) return '81'; // Japan
  if (digits.startsWith('82')) return '82'; // South Korea
  if (digits.startsWith('86')) return '86'; // China
  if (digits.startsWith('91')) return '91'; // India

  // For other countries, assume 1-3 digit country codes
  if (digits.length >= 10) {
    // Likely 1-digit country code
    return digits[0];
  }
  if (digits.length >= 9) {
    // Likely 2-digit country code
    return digits.slice(0, 2);
  }
  if (digits.length >= 8) {
    // Likely 3-digit country code
    return digits.slice(0, 3);
  }

  // Default to single digit
  return digits[0];
}
