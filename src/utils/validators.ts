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
