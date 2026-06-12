import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { KafkaEventConsumer } from './kafka-event-consumer.js';

describe('KafkaEventConsumer', () => {
  /** @type {KafkaEventConsumer} */
  let consumer;
  /** @type {mock.fn} */
  let mockLogEventUseCase;
  /** @type {mock.fn} */
  let mockConsumerRun;
  /** @type {Object} */
  let mockKafkaConsumer;
  /** @type {Object} */
  let mockKafka;

  beforeEach(() => {
    mockConsumerRun = mock.fn(async () => {});

    mockKafkaConsumer = {
      connect: mock.fn(async () => {}),
      subscribe: mock.fn(async () => {}),
      run: mockConsumerRun,
      disconnect: mock.fn(async () => {}),
    };

    mockKafka = {
      consumer: mock.fn(() => mockKafkaConsumer),
    };

    mockLogEventUseCase = {
      execute: mock.fn(async () => {}),
    };
  });

  afterEach(async () => {
    if (consumer) {
      try {
        await consumer.stop();
      } catch {
        // ignore
      }
    }
    mock.reset();
  });

  it('starts the consumer and subscribes to the topic', async () => {
    consumer = new KafkaEventConsumer({
      kafka: mockKafka,
      topic: 'device-events',
      groupId: 'test-group',
      logEventUseCase: mockLogEventUseCase,
    });

    await consumer.start();

    assert.strictEqual(mockKafkaConsumer.connect.mock.callCount(), 1);
    assert.strictEqual(mockKafkaConsumer.subscribe.mock.callCount(), 1);
    assert.strictEqual(
      mockKafkaConsumer.subscribe.mock.calls[0].arguments[0].topic,
      'device-events',
    );
    assert.strictEqual(mockConsumerRun.mock.callCount(), 1);
  });

  it('processes device.created message through LogEventUseCase', async () => {
    consumer = new KafkaEventConsumer({
      kafka: mockKafka,
      topic: 'device-events',
      groupId: 'test-group',
      logEventUseCase: mockLogEventUseCase,
    });

    await consumer.start();

    // Capture the eachMessage handler and invoke it
    const eachMessage = mockConsumerRun.mock.calls[0].arguments[0].eachMessage;
    await eachMessage({
      message: {
        value: Buffer.from(
          JSON.stringify({
            type: 'device.created',
            deviceId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'laptop',
            timestamp: '2026-06-12T10:00:00Z',
          }),
        ),
      },
    });

    assert.strictEqual(mockLogEventUseCase.execute.mock.callCount(), 1);
    const args = mockLogEventUseCase.execute.mock.calls[0].arguments[0];
    assert.strictEqual(args.type, 'device.created');
    assert.strictEqual(
      args.deviceId,
      '550e8400-e29b-41d4-a716-446655440000',
    );
    assert.strictEqual(args.name, 'laptop');
    assert.strictEqual(args.timestamp, '2026-06-12T10:00:00Z');
  });

  it('processes device.updated message through LogEventUseCase', async () => {
    consumer = new KafkaEventConsumer({
      kafka: mockKafka,
      topic: 'device-events',
      groupId: 'test-group',
      logEventUseCase: mockLogEventUseCase,
    });

    await consumer.start();

    const eachMessage = mockConsumerRun.mock.calls[0].arguments[0].eachMessage;
    await eachMessage({
      message: {
        value: Buffer.from(
          JSON.stringify({
            type: 'device.updated',
            deviceId: '550e8400-e29b-41d4-a716-446655440001',
            name: 'server',
            timestamp: '2026-06-12T11:00:00Z',
          }),
        ),
      },
    });

    assert.strictEqual(mockLogEventUseCase.execute.mock.callCount(), 1);
    const args = mockLogEventUseCase.execute.mock.calls[0].arguments[0];
    assert.strictEqual(args.type, 'device.updated');
    assert.strictEqual(args.name, 'server');
  });

  it('processes device.deleted message through LogEventUseCase', async () => {
    consumer = new KafkaEventConsumer({
      kafka: mockKafka,
      topic: 'device-events',
      groupId: 'test-group',
      logEventUseCase: mockLogEventUseCase,
    });

    await consumer.start();

    const eachMessage = mockConsumerRun.mock.calls[0].arguments[0].eachMessage;
    await eachMessage({
      message: {
        value: Buffer.from(
          JSON.stringify({
            type: 'device.deleted',
            deviceId: '550e8400-e29b-41d4-a716-446655440002',
            name: 'old-device',
            timestamp: '2026-06-12T12:00:00Z',
          }),
        ),
      },
    });

    assert.strictEqual(mockLogEventUseCase.execute.mock.callCount(), 1);
    const args = mockLogEventUseCase.execute.mock.calls[0].arguments[0];
    assert.strictEqual(args.type, 'device.deleted');
    assert.strictEqual(args.name, 'old-device');
  });

  it('skips malformed message (invalid JSON) with warning', async () => {
    consumer = new KafkaEventConsumer({
      kafka: mockKafka,
      topic: 'device-events',
      groupId: 'test-group',
      logEventUseCase: mockLogEventUseCase,
    });

    await consumer.start();

    const eachMessage = mockConsumerRun.mock.calls[0].arguments[0].eachMessage;
    await eachMessage({
      message: {
        value: Buffer.from('not-valid-json'),
      },
    });

    assert.strictEqual(mockLogEventUseCase.execute.mock.callCount(), 0);
  });

  it('skips message with unknown event type', async () => {
    consumer = new KafkaEventConsumer({
      kafka: mockKafka,
      topic: 'device-events',
      groupId: 'test-group',
      logEventUseCase: mockLogEventUseCase,
    });

    await consumer.start();

    const eachMessage = mockConsumerRun.mock.calls[0].arguments[0].eachMessage;
    await eachMessage({
      message: {
        value: Buffer.from(
          JSON.stringify({
            type: 'device.unknown',
            deviceId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'test',
            timestamp: '2026-06-12T10:00:00Z',
          }),
        ),
      },
    });

    assert.strictEqual(mockLogEventUseCase.execute.mock.callCount(), 0);
  });

  it('skips message with missing required fields', async () => {
    consumer = new KafkaEventConsumer({
      kafka: mockKafka,
      topic: 'device-events',
      groupId: 'test-group',
      logEventUseCase: mockLogEventUseCase,
    });

    await consumer.start();

    const eachMessage = mockConsumerRun.mock.calls[0].arguments[0].eachMessage;
    await eachMessage({
      message: {
        value: Buffer.from(
          JSON.stringify({
            type: 'device.created',
            // missing deviceId
            name: 'test',
            timestamp: '2026-06-12T10:00:00Z',
          }),
        ),
      },
    });

    assert.strictEqual(mockLogEventUseCase.execute.mock.callCount(), 0);
  });

  it('skips message with empty name', async () => {
    consumer = new KafkaEventConsumer({
      kafka: mockKafka,
      topic: 'device-events',
      groupId: 'test-group',
      logEventUseCase: mockLogEventUseCase,
    });

    await consumer.start();

    const eachMessage = mockConsumerRun.mock.calls[0].arguments[0].eachMessage;
    await eachMessage({
      message: {
        value: Buffer.from(
          JSON.stringify({
            type: 'device.created',
            deviceId: '550e8400-e29b-41d4-a716-446655440000',
            name: '   ',
            timestamp: '2026-06-12T10:00:00Z',
          }),
        ),
      },
    });

    assert.strictEqual(mockLogEventUseCase.execute.mock.callCount(), 0);
  });

  it('disconnects consumer on stop()', async () => {
    consumer = new KafkaEventConsumer({
      kafka: mockKafka,
      topic: 'device-events',
      groupId: 'test-group',
      logEventUseCase: mockLogEventUseCase,
    });

    await consumer.start();
    await consumer.stop();

    assert.strictEqual(mockKafkaConsumer.disconnect.mock.callCount(), 1);
  });

  it('handles kafkajs connection errors gracefully', async () => {
    const failingConsumerMock = {
      connect: mock.fn(async () => {
        throw new Error('Connection refused');
      }),
      subscribe: mock.fn(),
      run: mock.fn(),
      disconnect: mock.fn(),
    };
    const failingKafka = {
      consumer: mock.fn(() => failingConsumerMock),
    };

    consumer = new KafkaEventConsumer({
      kafka: failingKafka,
      topic: 'device-events',
      groupId: 'test-group',
      logEventUseCase: { execute: mock.fn() },
    });

    // Should not throw — the error is caught and logged
    await assert.doesNotReject(() => consumer.start());
  });

  it('recovers from per-message errors and continues consuming', async () => {
    consumer = new KafkaEventConsumer({
      kafka: mockKafka,
      topic: 'device-events',
      groupId: 'test-group',
      logEventUseCase: mockLogEventUseCase,
    });

    await consumer.start();
    const eachMessage = mockConsumerRun.mock.calls[0].arguments[0].eachMessage;

    // First message throws (invalid JSON) — should be caught
    await eachMessage({
      message: { value: Buffer.from('bad json') },
    });

    // Second message is valid — should be processed
    await eachMessage({
      message: {
        value: Buffer.from(
          JSON.stringify({
            type: 'device.created',
            deviceId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'laptop',
            timestamp: '2026-06-12T10:00:00Z',
          }),
        ),
      },
    });

    // Only the valid message should result in a use case call
    assert.strictEqual(mockLogEventUseCase.execute.mock.callCount(), 1);
  });
});
