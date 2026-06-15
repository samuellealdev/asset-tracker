import { ValidationError } from '../domain/event.js';

/**
 * Use case for listing events by device ID.
 *
 * Validates the deviceId format and delegates to the repository
 * to fetch events ordered by timestamp descending.
 */
export class ListEventsUseCase {
  /**
   * @param {import('../domain/event-repository.js').EventRepository} eventRepository
   */
  constructor(eventRepository) {
    /** @private */
    this.repo = eventRepository;
  }

  /**
   * List all events for a given device, ordered by timestamp descending.
   *
   * @param {string} deviceId - UUID v4 device identifier
   * @returns {Promise<import('../domain/event.js').Event[]>}
   * @throws {ValidationError} When deviceId is missing or not a valid UUID
   */
  async execute(deviceId) {
    if (!deviceId || typeof deviceId !== 'string' || deviceId.trim().length === 0) {
      throw new ValidationError('deviceId is required');
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(deviceId)) {
      throw new ValidationError('deviceId must be a valid UUID v4');
    }

    return this.repo.findByDeviceId(deviceId);
  }
}
