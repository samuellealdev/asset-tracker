/**
 * EventConsumer port — defines the contract for inbound event adapters.
 *
 * Any adapter that consumes events from an external source (Kafka, RabbitMQ, SQS, etc.)
 * must implement this interface. The application layer depends on this contract,
 * not on any specific messaging technology.
 *
 * @interface
 */
export class EventConsumer {
  /**
   * Start consuming events from the external source.
   * Must be idempotent — calling it multiple times should not create duplicate consumers.
   * @returns {Promise<void>}
   */
  async startConsuming() {
    throw new Error('EventConsumer.startConsuming() must be implemented by subclass');
  }

  /**
   * Handle a single event received from the external source.
   * @param {import('../domain/event.js').Event} event — The domain event to process
   * @returns {Promise<void>}
   */
  async handleEvent(event) {
    throw new Error('EventConsumer.handleEvent() must be implemented by subclass');
  }
}
