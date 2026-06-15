import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { ListEventsUseCase } from './list-events.js';
import { ValidationError } from '../domain/event.js';

describe('ListEventsUseCase', () => {
  it('returns events for a valid deviceId', async () => {
    const events = [
      { id: '1', type: 'device.delivered', deviceId: '550e8400-e29b-41d4-a716-446655440000', name: 'laptop', timestamp: '2025-01-01T00:00:00.000Z', actor: null, description: null },
    ];
    const mockRepo = {
      findByDeviceId: mock.fn(async () => events),
    };
    const useCase = new ListEventsUseCase(mockRepo);

    const result = await useCase.execute('550e8400-e29b-41d4-a716-446655440000');

    assert.deepStrictEqual(result, events);
    assert.strictEqual(mockRepo.findByDeviceId.mock.callCount(), 1);
    assert.strictEqual(
      mockRepo.findByDeviceId.mock.calls[0].arguments[0],
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('throws ValidationError when deviceId is missing', async () => {
    const mockRepo = { findByDeviceId: mock.fn() };
    const useCase = new ListEventsUseCase(mockRepo);

    await assert.rejects(
      () => useCase.execute(''),
      ValidationError,
    );
    assert.strictEqual(mockRepo.findByDeviceId.mock.callCount(), 0);
  });

  it('throws ValidationError when deviceId is not a valid UUID', async () => {
    const mockRepo = { findByDeviceId: mock.fn() };
    const useCase = new ListEventsUseCase(mockRepo);

    await assert.rejects(
      () => useCase.execute('not-a-uuid'),
      ValidationError,
    );
    assert.strictEqual(mockRepo.findByDeviceId.mock.callCount(), 0);
  });

  it('returns empty array when no events exist for deviceId', async () => {
    const mockRepo = {
      findByDeviceId: mock.fn(async () => []),
    };
    const useCase = new ListEventsUseCase(mockRepo);

    const result = await useCase.execute('550e8400-e29b-41d4-a716-446655440000');

    assert.deepStrictEqual(result, []);
    assert.strictEqual(mockRepo.findByDeviceId.mock.callCount(), 1);
  });

  it('propagates repository error', async () => {
    const dbError = new Error('DB connection failed');
    const mockRepo = {
      findByDeviceId: mock.fn(async () => { throw dbError; }),
    };
    const useCase = new ListEventsUseCase(mockRepo);

    await assert.rejects(
      () => useCase.execute('550e8400-e29b-41d4-a716-446655440000'),
      dbError,
    );
  });
});
