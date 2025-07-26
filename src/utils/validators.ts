/**
 * Utility functions for validating Loop API parameters
 */
import { LIMITS } from '../constants.js';
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
  const phoneRegex = /^\+[0-9]{5,15}$/;

  if (!phoneRegex.test(phone)) {
    throw LoopMessageError.invalidParamError(
      'recipient',
      'Phone number must start with + and contain 5-15 digits'
    );
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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw LoopMessageError.invalidParamError('recipient', 'Invalid email format');
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
    throw LoopMessageError.missingParamError('text');
  }

  if (text.length > LIMITS.MAX_TEXT_LENGTH) {
    throw LoopMessageError.invalidParamError(
      'text',
      `Text exceeds maximum length of ${LIMITS.MAX_TEXT_LENGTH} characters`
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
      throw LoopMessageError.invalidParamError(paramName, 'URL must use HTTPS protocol');
    }

    return true;
  } catch (error) {
    if (error instanceof LoopMessageError) {
      throw error;
    }

    throw LoopMessageError.invalidParamError(paramName, 'Invalid URL format');
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
      `Maximum of ${LIMITS.MAX_ATTACHMENTS} attachments allowed`
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
      `Passthrough exceeds maximum length of ${LIMITS.MAX_PASSTHROUGH_LENGTH} characters`
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

  const validEffects = [
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
  ];

  if (!validEffects.includes(effect)) {
    throw LoopMessageError.invalidParamError(
      'effect',
      `Invalid effect. Must be one of: ${validEffects.join(', ')}`
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

  const validReactions = [
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
  ];

  if (!validReactions.includes(reaction)) {
    throw LoopMessageError.invalidParamError(
      'reaction',
      `Invalid reaction. Must be one of: ${validReactions.join(', ')}`
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

  const validServices = ['imessage', 'sms'];

  if (!validServices.includes(service)) {
    throw LoopMessageError.invalidParamError(
      'service',
      `Invalid service. Must be one of: ${validServices.join(', ')}`
    );
  }

  return true;
}
