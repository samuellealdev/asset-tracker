import crypto from 'node:crypto';

export class ValidationError extends Error {
  /**
   * @param {string} message
   * @param {string[]} [errors]
   */
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * @typedef {Object} Event
 * @property {string} id - UUID v4
 * @property {string} type - Non-empty event type string
 * @property {string} deviceId - Non-empty device identifier
 * @property {string} timestamp - ISO 8601 string
 */

/**
 * Create a new Event entity.
 *
 * @param {Object} params
 * @param {string} params.type - Event type (required, non-empty)
 * @param {string} params.deviceId - Device identifier (required, non-empty)
 * @param {string} [params.timestamp] - ISO 8601 timestamp (defaults to now)
 * @returns {Readonly<Event>} A frozen Event object
 * @throws {ValidationError} When required fields are missing or invalid
 */
export function createEvent({ type, deviceId, timestamp } = {}) {
  const errors = [];

  if (!type || typeof type !== 'string' || type.trim().length === 0) {
    errors.push('type is required and must be a non-empty string');
  }

  if (
    !deviceId ||
    typeof deviceId !== 'string' ||
    deviceId.trim().length === 0
  ) {
    errors.push('deviceId is required and must be a non-empty string');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join('; '), errors);
  }

  return Object.freeze({
    id: crypto.randomUUID(),
    type,
    deviceId,
    timestamp: timestamp || new Date().toISOString(),
  });
}
