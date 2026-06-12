import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const VALID_EVENT_TYPES = new Set([
  'device.created',
  'device.updated',
  'device.deleted',
]);

/**
 * @typedef {Object} KafkaEventConsumerOptions
 * @property {import('@confluentinc/kafka-javascript').KafkaJS.Kafka} kafka - Kafka client instance (kafkajs-compatible)
 * @property {string} topic - Topic to consume from
 * @property {string} groupId - Consumer group ID
 * @property {import('../application/log-event.js').LogEventUseCase} logEventUseCase - Use case to handle events
 */

/**
 * Infrastructure adapter that consumes device lifecycle events from Kafka
 * and delegates them to the LogEventUseCase for persistence.
 *
 * Implements the inbound EventConsumer port (informal — uses duck typing).
 */
export class KafkaEventConsumer {
  /**
   * @param {KafkaEventConsumerOptions} options
   */
  constructor({ kafka, topic, groupId, logEventUseCase }) {
    /** @private */
    this.kafka = kafka;
    /** @private */
    this.topic = topic;
    /** @private */
    this.groupId = groupId;
    /** @private */
    this.logEventUseCase = logEventUseCase;
    /** @private */
    this.consumer = null;
  }

  /**
   * Start consuming messages from the Kafka topic.
   * Connects, subscribes, and begins the consumer loop.
   * Errors during startup are caught and logged — does NOT crash the process.
   */
  async start() {
    try {
      this.consumer = this.kafka.consumer({ kafkaJS: { groupId: this.groupId, fromBeginning: false } });
      await this.consumer.connect();
      await this.consumer.subscribe({
        topic: this.topic,
      });
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          await this.#handleMessage(message);
        },
      });
      logger.info(
        { topic: this.topic, groupId: this.groupId },
        'kafka consumer started',
      );
    } catch (err) {
      logger.warn(
        { err, topic: this.topic, groupId: this.groupId },
        'failed to start kafka consumer — continuing without consumer',
      );
    }
  }

  /**
   * Stop the consumer gracefully.
   */
  async stop() {
    if (this.consumer) {
      try {
        await this.consumer.disconnect();
        logger.info('kafka consumer disconnected');
      } catch (err) {
        logger.warn({ err }, 'error disconnecting kafka consumer');
      }
    }
  }

  /**
   * Handle a single Kafka message: parse, validate, and persist.
   * Malformed messages are skipped with a warning — the consumer never crashes.
   *
   * @param {{ value: Buffer }} message
   * @private
   */
  async #handleMessage(message) {
    try {
      const raw = message.value.toString();
      /** @type {{ type?: string; deviceId?: string; name?: string; timestamp?: string }} */
      let event;
      try {
        event = JSON.parse(raw);
      } catch {
        logger.warn({ raw }, 'malformed kafka message — invalid JSON, skipping');
        return;
      }

      if (!this.#validate(event)) {
        return;
      }

      await this.logEventUseCase.execute({
        type: event.type,
        deviceId: event.deviceId,
        name: event.name,
        timestamp: event.timestamp,
      });
    } catch (err) {
      // Catch any unexpected error so a single message never crashes the consumer
      logger.warn({ err }, 'unexpected error processing kafka message — skipping');
    }
  }

  /**
   * Validate that the event has all required fields and a known type.
   *
   * @param {Record<string, unknown>} event
   * @returns {boolean}
   * @private
   */
  #validate(event) {
    if (!event.type || typeof event.type !== 'string') {
      logger.warn({ event }, 'invalid kafka message — missing or invalid type');
      return false;
    }

    if (!VALID_EVENT_TYPES.has(event.type)) {
      logger.warn({ type: event.type }, 'invalid kafka message — unknown event type');
      return false;
    }

    if (!event.deviceId || typeof event.deviceId !== 'string' || event.deviceId.trim().length === 0) {
      logger.warn({ event }, 'invalid kafka message — missing or invalid deviceId');
      return false;
    }

    if (!event.name || typeof event.name !== 'string' || event.name.trim().length === 0) {
      logger.warn({ event }, 'invalid kafka message — missing or invalid name');
      return false;
    }

    if (!event.timestamp || typeof event.timestamp !== 'string') {
      logger.warn({ event }, 'invalid kafka message — missing or invalid timestamp');
      return false;
    }

    return true;
  }
}
