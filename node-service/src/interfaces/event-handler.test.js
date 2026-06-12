import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { EventHandler } from './event-handler.js';
import { ValidationError } from '../domain/event.js';

/**
 * Creates an HTTP server with the EventHandler wired for POST /events.
 *
 * @param {EventHandler} handler
 * @returns {http.Server}
 */
function createTestServer(handler) {
  return http.createServer((req, res) => {
    if (req.url === '/events' && req.method === 'POST') {
      handler.handlePost(req, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
    }
  });
}

/**
 * Sends a POST request to the test server and returns the response.
 *
 * @param {http.Server} server
 * @param {string} body - Raw request body string
 * @param {string} [contentType] - Content-Type header value
 * @returns {Promise<{ status: number, body: string, headers: http.IncomingHttpHeaders }>}
 */
function postEvents(server, body, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    if (!addr || typeof addr === 'string') {
      reject(new Error('cannot determine server address'));
      return;
    }
    const { port } = addr;

    const options = {
      hostname: '127.0.0.1',
      port,
      path: '/events',
      method: 'POST',
      headers: { 'Content-Type': contentType },
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: Buffer.concat(chunks).toString(),
          headers: res.headers,
        });
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

describe('EventHandler', () => {
  it('returns 201 with event JSON on successful POST', async () => {
    const event = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'device.created',
      deviceId: '550e8400-e29b-41d4-a716-446655440000',
      timestamp: '2025-01-01T00:00:00.000Z',
    };
    const mockUseCase = {
      execute: mock.fn(async () => event),
    };
    const handler = new EventHandler(mockUseCase);
    const server = createTestServer(handler);

    await new Promise((r) => server.listen(0, r));
    try {
      const res = await postEvents(
        server,
        JSON.stringify({ type: 'device.created', deviceId: event.deviceId }),
      );

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body, JSON.stringify(event));
    } finally {
      server.close();
    }
  });

  it('returns 400 with error when type is missing', async () => {
    const mockUseCase = {
      execute: mock.fn(async () => {
        throw new ValidationError('type is required');
      }),
    };
    const handler = new EventHandler(mockUseCase);
    const server = createTestServer(handler);

    await new Promise((r) => server.listen(0, r));
    try {
      const res = await postEvents(
        server,
        JSON.stringify({ deviceId: '550e8400-e29b-41d4-a716-446655440000' }),
      );

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body, JSON.stringify({ error: 'type is required' }));
    } finally {
      server.close();
    }
  });

  it('returns 400 with error when deviceId is missing', async () => {
    const mockUseCase = {
      execute: mock.fn(async () => {
        throw new ValidationError('deviceId is required');
      }),
    };
    const handler = new EventHandler(mockUseCase);
    const server = createTestServer(handler);

    await new Promise((r) => server.listen(0, r));
    try {
      const res = await postEvents(
        server,
        JSON.stringify({ type: 'device.created' }),
      );

      assert.strictEqual(res.status, 400);
      assert.strictEqual(
        res.body,
        JSON.stringify({ error: 'deviceId is required' }),
      );
    } finally {
      server.close();
    }
  });

  it('returns 400 with error for invalid JSON body', async () => {
    const mockUseCase = { execute: mock.fn() };
    const handler = new EventHandler(mockUseCase);
    const server = createTestServer(handler);

    await new Promise((r) => server.listen(0, r));
    try {
      const res = await postEvents(server, 'not-json{');

      assert.strictEqual(res.status, 400);
      assert.strictEqual(
        res.body,
        JSON.stringify({ error: 'invalid JSON body' }),
      );
      assert.strictEqual(mockUseCase.execute.mock.callCount(), 0);
    } finally {
      server.close();
    }
  });

  it('returns 500 when use case throws an unexpected error', async () => {
    const mockUseCase = {
      execute: mock.fn(async () => {
        throw new Error('DB exploded');
      }),
    };
    const handler = new EventHandler(mockUseCase);
    const server = createTestServer(handler);

    await new Promise((r) => server.listen(0, r));
    try {
      const res = await postEvents(
        server,
        JSON.stringify({
          type: 'device.created',
          deviceId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      );

      assert.strictEqual(res.status, 500);
      assert.strictEqual(
        res.body,
        JSON.stringify({ error: 'internal server error' }),
      );
    } finally {
      server.close();
    }
  });
});
