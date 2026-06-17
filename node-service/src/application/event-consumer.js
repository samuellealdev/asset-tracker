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
  async start() {
    throw new Error('EventConsumer.start() must be implemented by subclass');
  }
}
