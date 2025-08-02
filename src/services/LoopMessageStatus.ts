/**
 * LoopMessageStatus - Service for checking message status via the Loop Message API
 */
import { API, DEFAULTS, MESSAGE_STATUS, EVENTS } from '../constants.js';
import { LoopMessageError } from '../errors/LoopMessageError.js';
import type { StatusServiceConfig } from '../LoopCredentials.js';
import type { MessageStatus, MessageStatusResponse } from '../types.js';
import { LoopHttpClient } from '../utils/loopHttpClient.js';
import { EventService } from '../utils/eventService.js';

// Status update event names - exported from constants
export const STATUS_EVENTS = EVENTS.STATUS;

/**
 * Service for checking message status via the Loop Message API
 */
export class MessageStatusChecker extends EventService {
  private readonly statusClient: LoopHttpClient;

  /**
   * Creates a new MessageStatusChecker instance
   *
   * @param config - API credentials and configuration
   */
  constructor(config: StatusServiceConfig) {
    // Initialize the EventService base class
    super();

    // Create the HTTP client
    this.statusClient = new LoopHttpClient(config, 'status');
  }

  /**
   * Check the status of a message
   *
   * @param messageId - The message ID to check
   * @returns Promise resolving to the message status
   * @throws {LoopMessageError} If the request fails
   */
  async checkStatus(messageId: string): Promise<MessageStatusResponse> {
    if (!messageId) {
      const error = LoopMessageError.missingParamError('messageId');
      this.emit('error', error);
      throw error;
    }

    try {
      this.emit(STATUS_EVENTS.STATUS_CHECK, { messageId });

      // Using the LoopHttpClient which already has retry logic
      const response = await this.statusClient.get<MessageStatusResponse>(
        `${API.ENDPOINTS.STATUS}${messageId}/`
      );

      this.emit(STATUS_EVENTS.STATUS_CHECK, {
        messageId,
        status: response,
      });

      return response;
    } catch (error) {
      // Emit the error event before rethrowing
      this.emit(STATUS_EVENTS.STATUS_ERROR, { messageId, error });

      // The HTTP client already handles and transforms errors
      throw error;
    }
  }

  /**
   * Wait for a message to reach a specific status or one of several statuses
   *
   * @param messageId - The message ID to check
   * @param targetStatus - Status or array of statuses to wait for
   * @param options - Optional configuration for polling
   * @returns Promise resolving to the final message status response
   * @throws {LoopMessageError} If the request fails or timeout is reached
   */
  async waitForStatus(
    messageId: string,
    targetStatus: MessageStatus | MessageStatus[],
    options: {
      maxAttempts?: number;
      delayMs?: number;
      timeoutMs?: number;
    } = {}
  ): Promise<MessageStatusResponse> {
    const {
      maxAttempts = DEFAULTS.STATUS_MAX_ATTEMPTS,
      delayMs = DEFAULTS.STATUS_POLL_INTERVAL,
      timeoutMs = DEFAULTS.STATUS_TIMEOUT,
    } = options;

    const targetStatuses = Array.isArray(targetStatus) ? targetStatus : [targetStatus];

    let attempts = 0;
    const startTime = Date.now();
    let lastStatus: MessageStatus | null = null;

    while (attempts < maxAttempts) {
      if (timeoutMs > 0 && Date.now() - startTime > timeoutMs) {
        const errorMessage = `Message did not reach target status(es) [${targetStatuses.join(
          ', '
        )}] within ${timeoutMs}ms`;

        const error = LoopMessageError.timeoutError(errorMessage);
        this.emit(STATUS_EVENTS.STATUS_TIMEOUT, {
          messageId,
          targetStatuses,
          elapsed: Date.now() - startTime,
          attempts,
        });

        this.emit('error', error);
        throw error;
      }

      const status = await this.checkStatus(messageId);

      // Emit status change event if status changed
      if (lastStatus !== null && lastStatus !== status.status) {
        this.emit(STATUS_EVENTS.STATUS_CHANGE, {
          messageId,
          oldStatus: lastStatus,
          newStatus: status.status,
          status,
        });
      }

      lastStatus = status.status as MessageStatus;

      if (targetStatuses.includes(status.status as MessageStatus)) {
        return status;
      }

      // If the status is 'failed', no need to keep checking
      if (status.status === MESSAGE_STATUS.FAILED) {
        return status;
      }

      attempts++;

      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // If we've exhausted attempts, return the last status we got
    return this.checkStatus(messageId);
  }
}
