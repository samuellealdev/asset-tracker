import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { LogEventUseCase } from './log-event.js';
import { ValidationError } from '../domain/event.js';

describe('LogEventUseCase', () => {
  it('saves and returns the event on valid input', async () => {
    const mockRepo = { save: mock.fn(() => Promise.resolve()) };
    const useCase = new LogEventUseCase(mockRepo);

    const event = await useCase.execute({
      type: 'device_created',
      deviceId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'laptop',
    });

    assert.ok(event.id);
    assert.strictEqual(event.type, 'device_created');
    assert.strictEqual(event.deviceId, '550e8400-e29b-41d4-a716-446655440000');
    assert.strictEqual(event.name, 'laptop');
    assert.strictEqual(mockRepo.save.mock.callCount(), 1);
    assert.strictEqual(mockRepo.save.mock.calls[0].arguments[0], event);
  });

  it('throws ValidationError when type is missing', async () => {
    const mockRepo = { save: mock.fn() };
    const useCase = new LogEventUseCase(mockRepo);

    await assert.rejects(
      () =>
        useCase.execute({
          deviceId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'laptop',
        }),
      ValidationError,
    );
    assert.strictEqual(mockRepo.save.mock.callCount(), 0);
  });

  it('throws ValidationError when deviceId is missing', async () => {
    const mockRepo = { save: mock.fn() };
    const useCase = new LogEventUseCase(mockRepo);

    await assert.rejects(
      () => useCase.execute({ type: 'device_created', name: 'laptop' }),
      ValidationError,
    );
    assert.strictEqual(mockRepo.save.mock.callCount(), 0);
  });

  it('throws ValidationError when name is missing', async () => {
    const mockRepo = { save: mock.fn() };
    const useCase = new LogEventUseCase(mockRepo);

    await assert.rejects(
      () =>
        useCase.execute({
          type: 'device_created',
          deviceId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      ValidationError,
    );
    assert.strictEqual(mockRepo.save.mock.callCount(), 0);
  });

  it('propagates repository save failure', async () => {
    const dbError = new Error('DB connection failed');
    const mockRepo = { save: mock.fn(() => Promise.reject(dbError)) };
    const useCase = new LogEventUseCase(mockRepo);

    await assert.rejects(
      () =>
        useCase.execute({
          type: 'device_created',
          deviceId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'laptop',
        }),
      dbError,
    );
  });
});
