import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';
import { HealthHandler } from './health-handler.js';

/**
 * Creates a mock ServerResponse-like object for testing.
 *
 * @returns {EventEmitter & { statusCode: number, writeHead: ReturnType<typeof mock.fn>, end: ReturnType<typeof mock.fn> }}
 */
function createMockRes() {
  const res = new EventEmitter();
  res.statusCode = 200;
  res.writeHead = mock.fn(function (code, headers) {
    this.statusCode = code;
    return this;
  });
  res.end = mock.fn();
  return res;
}

describe('HealthHandler', () => {
  it('handleLive returns 200 with ok status', () => {
    const handler = new HealthHandler({});
    const req = {};
    const res = createMockRes();

    handler.handleLive(req, res);

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.end.mock.calls[0].arguments[0]);
    assert.strictEqual(body.status, 'ok');
  });

  it('handleReady returns 200 when DB ping succeeds', async () => {
    const mongoClient = {
      db: mock.fn(() => ({
        admin: mock.fn(() => ({
          ping: mock.fn(async () => ({ ok: 1 })),
        })),
      })),
    };
    const handler = new HealthHandler(mongoClient);
    const req = {};
    const res = createMockRes();

    await handler.handleReady(req, res);

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.end.mock.calls[0].arguments[0]);
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.database, 'connected');
  });

  it('handleReady returns 503 when DB ping fails', async () => {
    const mongoClient = {
      db: mock.fn(() => ({
        admin: mock.fn(() => ({
          ping: mock.fn(async () => {
            throw new Error('connection refused');
          }),
        })),
      })),
    };
    const handler = new HealthHandler(mongoClient);
    const req = {};
    const res = createMockRes();

    await handler.handleReady(req, res);

    assert.strictEqual(res.statusCode, 503);
    const body = JSON.parse(res.end.mock.calls[0].arguments[0]);
    assert.strictEqual(body.status, 'degraded');
    assert.strictEqual(body.database, 'disconnected');
  });

  it('handleReady returns 503 when DB ping times out', async () => {
    const mongoClient = {
      db: mock.fn(() => ({
        admin: mock.fn(() => ({
          ping: mock.fn(() => new Promise(() => {})), // never resolves
        })),
      })),
    };
    const handler = new HealthHandler(mongoClient);
    const req = {};
    const res = createMockRes();

    await handler.handleReady(req, res);

    assert.strictEqual(res.statusCode, 503);
    const body = JSON.parse(res.end.mock.calls[0].arguments[0]);
    assert.strictEqual(body.status, 'degraded');
    assert.strictEqual(body.database, 'disconnected');
  });

  it('handleHealth acts as alias for handleReady (200 when DB is up)', async () => {
    const mongoClient = {
      db: mock.fn(() => ({
        admin: mock.fn(() => ({
          ping: mock.fn(async () => ({ ok: 1 })),
        })),
      })),
    };
    const handler = new HealthHandler(mongoClient);
    const req = {};
    const res = createMockRes();

    await handler.handleHealth(req, res);

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.end.mock.calls[0].arguments[0]);
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.database, 'connected');
  });

  it('handleHealth returns 503 when DB is down', async () => {
    const mongoClient = {
      db: mock.fn(() => ({
        admin: mock.fn(() => ({
          ping: mock.fn(async () => {
            throw new Error('timeout');
          }),
        })),
      })),
    };
    const handler = new HealthHandler(mongoClient);
    const req = {};
    const res = createMockRes();

    await handler.handleHealth(req, res);

    assert.strictEqual(res.statusCode, 503);
    const body = JSON.parse(res.end.mock.calls[0].arguments[0]);
    assert.strictEqual(body.status, 'degraded');
    assert.strictEqual(body.database, 'disconnected');
  });
});
