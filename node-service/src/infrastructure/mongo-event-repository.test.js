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
    });

    const result = await repo.save(event);

    assert.ok(result.insertedId);
  });

  it('persists the event document in MongoDB with all fields', async () => {
    const repo = new MongoEventRepository(client, TEST_DB);
    const event = createEvent({
      type: 'device.updated',
      deviceId: '660e8400-e29b-41d4-a716-446655440001',
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
