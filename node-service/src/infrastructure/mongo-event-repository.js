/**
 * MongoDB adapter for the EventRepository port.
 *
 * @implements {import('../domain/event-repository.js').EventRepository}
 */
export class MongoEventRepository {
  /**
   * @param {import('mongodb').MongoClient} mongoClient - Connected MongoClient
   * @param {string} [dbName] - Database name (default: 'asset_tracker')
   * @param {string} [collectionName] - Collection name (default: 'events')
   */
  constructor(
    mongoClient,
    dbName = 'asset_tracker',
    collectionName = 'events',
  ) {
    /** @private */
    this.collection = mongoClient.db(dbName).collection(collectionName);
  }

  /**
   * Persist an event document in MongoDB.
   *
   * @param {import('../domain/event.js').Event} event - The event to persist
   * @returns {Promise<import('mongodb').InsertOneResult>} MongoDB insert result
   */
  async save(event) {
    // Spread into a plain object — the domain entity is frozen (Object.freeze)
    // but MongoDB's driver mutates documents to add _id.
    return this.collection.insertOne({ ...event });
  }

  /**
   * Find all events for a device, ordered by timestamp descending.
   *
   * @param {string} deviceId
   * @returns {Promise<import('../domain/event.js').Event[]>}
   */
  async findByDeviceId(deviceId) {
    const docs = await this.collection
      .find({ deviceId })
      .sort({ timestamp: -1 })
      .toArray();

    return docs.map((doc) => ({
      id: doc.id,
      type: doc.type,
      deviceId: doc.deviceId,
      name: doc.name,
      timestamp: doc.timestamp,
      actor: doc.actor ?? null,
      description: doc.description ?? null,
    }));
  }
}
