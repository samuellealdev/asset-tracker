import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createEvent, ValidationError } from './event.js';

describe('Event entity', () => {
  it('creates a valid event with type and deviceId', () => {
    const event = createEvent({
      type: 'device_created',
      deviceId: '550e8400-e29b-41d4-a716-446655440000',
    });

    assert.ok(event.id);
    assert.strictEqual(event.type, 'device_created');
    assert.strictEqual(event.deviceId, '550e8400-e29b-41d4-a716-446655440000');
    assert.ok(event.timestamp);
    assert.match(event.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  });

  it('throws ValidationError when type is missing', () => {
    assert.throws(
      () => createEvent({ deviceId: '550e8400-e29b-41d4-a716-446655440000' }),
      (err) =>
        err instanceof ValidationError &&
        err.errors.includes('type is required and must be a non-empty string'),
    );
  });

  it('throws ValidationError when deviceId is missing', () => {
    assert.throws(
      () => createEvent({ type: 'device_created' }),
      (err) =>
        err instanceof ValidationError &&
        err.errors.includes(
          'deviceId is required and must be a non-empty string',
        ),
    );
  });

  it('uses custom timestamp when provided', () => {
    const customTimestamp = '2025-01-01T00:00:00.000Z';
    const event = createEvent({
      type: 'device_created',
      deviceId: '550e8400-e29b-41d4-a716-446655440000',
      timestamp: customTimestamp,
    });
    assert.strictEqual(event.timestamp, customTimestamp);
  });

  it('returns a frozen object', () => {
    const event = createEvent({
      type: 'device_created',
      deviceId: '550e8400-e29b-41d4-a716-446655440000',
    });
    assert.ok(Object.isFrozen(event));
  });

  it('generates a UUID v4 for id', () => {
    const event = createEvent({
      type: 'device_created',
      deviceId: '550e8400-e29b-41d4-a716-446655440000',
    });
    assert.match(
      event.id,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
