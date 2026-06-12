import { createEvent } from '../domain/event.js';

export class LogEventUseCase {
  /**
   * @param {import('../domain/event-repository.js').EventRepository} eventRepository
   */
  constructor(eventRepository) {
    /** @private */
    this.repo = eventRepository;
  }

  /**
   * Validate, create, and persist an event.
   *
   * @param {Object} params
   * @param {string} params.type - Event type
   * @param {string} params.deviceId - Device identifier
   * @param {string} [params.timestamp] - Optional ISO 8601 timestamp
   * @returns {Promise<import('../domain/event.js').Event>} The saved event
   * @throws {import('../domain/event.js').ValidationError} On invalid input
   */
  async execute({ type, deviceId, timestamp }) {
    const event = createEvent({ type, deviceId, timestamp });
    await this.repo.save(event);
    return event;
  }
}
