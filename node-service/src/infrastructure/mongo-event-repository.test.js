import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { MongoClient } from 'mongodb';
import { MongoEventRepository } from './mongo-event-repository.js';
import { createEvent } from '../domain/event.js';

const MONGO_URI = process.env.MONGO_URI;
const TEST_DB = 'asset_tracker_test';

describe('MongoEventRepository', { skip: !MONGO_URI ? 'MONGO_URI not set' : false }, () => {
  /** @type {MongoClient} */
  let client;

  before(async () => {
    client = new MongoClient(MONGO_URI);
    await client.connect();
  });

  after(async () => {
    if (client) {
      await client.db(TEST_DB).dropDatabase();
      await client.close();
    }
  });

  it('saves an event and returns result with insertedId', async () => {
    const repo = new MongoEventRepository(client, TEST_DB);
    const event = createEvent({
      type: 'device.created',
      deviceId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'test-device',
    });

    const result = await repo.save(event);

    assert.ok(result.insertedId);
  });

  it('findByDeviceId returns events sorted by timestamp descending', async () => {
    const repo = new MongoEventRepository(client, TEST_DB);
    const deviceId = '770e8400-e29b-41d4-a716-446655440002';

    const event1 = createEvent({
      type: 'device.delivered',
      deviceId,
      name: 'laptop',
      timestamp: '2025-01-02T00:00:00.000Z',
      actor: 'samuel.leal',
      description: 'Entregado',
    });

    const event2 = createEvent({
      type: 'device.returned',
      deviceId,
      name: 'laptop',
      timestamp: '2025-01-01T00:00:00.000Z',
    });

    await repo.save(event1);
    await repo.save(event2);

    const results = await repo.findByDeviceId(deviceId);

    assert.strictEqual(results.length, 2);
    // Most recent first
    assert.strictEqual(results[0].id, event1.id);
    assert.strictEqual(results[1].id, event2.id);
    // Verify actor/description
    assert.strictEqual(results[0].actor, 'samuel.leal');
    assert.strictEqual(results[0].description, 'Entregado');
    assert.strictEqual(results[1].actor, null);
    assert.strictEqual(results[1].description, null);
  });

  it('findByDeviceId returns empty array for unknown deviceId', async () => {
    const repo = new MongoEventRepository(client, TEST_DB);
    const results = await repo.findByDeviceId('00000000-0000-0000-0000-000000000000');
    assert.deepStrictEqual(results, []);
  });

  it('persists the event document in MongoDB with all fields', async () => {
    const repo = new MongoEventRepository(client, TEST_DB);
    const event = createEvent({
      type: 'device.updated',
      deviceId: '660e8400-e29b-41d4-a716-446655440001',
      name: 'test-device',
    });

    await repo.save(event);

    const doc = await client
      .db(TEST_DB)
      .collection('events')
      .findOne({ id: event.id });

    assert.ok(doc);
    assert.strictEqual(doc.type, 'device.updated');
    assert.strictEqual(
      doc.deviceId,
      '660e8400-e29b-41d4-a716-446655440001',
    );
    assert.strictEqual(doc.id, event.id);
    assert.strictEqual(doc.timestamp, event.timestamp);
  });
});
