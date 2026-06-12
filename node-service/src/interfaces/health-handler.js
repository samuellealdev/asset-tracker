/**
 * HTTP handler for health check endpoints.
 *
 * Receives a connected MongoClient via constructor (manual DI).
 * Provides liveness (/health/live), readiness (/health/ready),
 * and a backward-compatible alias (/health → handleReady).
 */
export class HealthHandler {
  /**
   * @param {import('mongodb').MongoClient} mongoClient - A connected MongoClient
   */
  constructor(mongoClient) {
    /** @private */
    this.mongoClient = mongoClient;
  }

  /**
   * Liveness probe — always returns 200 while the process is running.
   *
   * @param {import('node:http').IncomingMessage} _req
   * @param {import('node:http').ServerResponse} res
   */
  handleLive(_req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }) + '\n');
  }

  /**
   * Readiness probe — pings MongoDB and returns 200 if reachable, 503 if not.
   *
   * @param {import('node:http').IncomingMessage} _req
   * @param {import('node:http').ServerResponse} res
   */
  async handleReady(_req, res) {
    try {
      await this.mongoClient.db().admin().ping();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', database: 'connected' }) + '\n');
    } catch {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({ status: 'error', database: 'unreachable' }) + '\n',
      );
    }
  }

  /**
   * Backward-compatible alias for handleReady.
   * Existing callers using GET /health will continue to work.
   *
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   */
  handleHealth(req, res) {
    return this.handleReady(req, res);
  }
}
