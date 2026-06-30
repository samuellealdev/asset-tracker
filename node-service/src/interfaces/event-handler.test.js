import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { EventHandler } from './event-handler.js';
import { ValidationError } from '../domain/event.js';

/**
 * Creates an HTTP server with the EventHandler wired for POST and GET /events.
 *
 * @param {EventHandler} handler
 * @returns {http.Server}
 */
function createTestServer(handler) {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (url.pathname === '/events' && req.method === 'GET') {
      handler.handleGet(req, res);
    } else if (req.url === '/events' && req.method === 'POST') {
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

/**
 * Sends a GET request to the test server and returns the response.
 *
 * @param {http.Server} server
 * @param {string} path - URL path with optional query string
 * @returns {Promise<{ status: number, body: string, headers: http.IncomingHttpHeaders }>}
 */
function getEvents(server, path) {
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
      path,
      method: 'GET',
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

  it('returns 201 with actor and description when provided in POST body', async () => {
    const event = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'device.delivered',
      deviceId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'laptop',
      timestamp: '2025-01-01T00:00:00.000Z',
      actor: 'samuel.leal',
      description: 'Entregado al trabajador',
    };
    const mockLogUseCase = {
      execute: mock.fn(async () => event),
    };
    const mockListUseCase = { execute: mock.fn() };
    const handler = new EventHandler(mockLogUseCase, mockListUseCase);
    const server = createTestServer(handler);

    await new Promise((r) => server.listen(0, r));
    try {
      const res = await postEvents(
        server,
        JSON.stringify({
          type: 'device.delivered',
          deviceId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'laptop',
          actor: 'samuel.leal',
          description: 'Entregado al trabajador',
        }),
      );

      assert.strictEqual(res.status, 201);
      const body = JSON.parse(res.body);
      assert.strictEqual(body.actor, 'samuel.leal');
      assert.strictEqual(body.description, 'Entregado al trabajador');
    } finally {
      server.close();
    }
  });

  // --- GET /events ---

  it('GET returns 200 with JSON array for valid deviceId', async () => {
    const events = [
      { id: '1', type: 'device.delivered', deviceId: '550e8400-e29b-41d4-a716-446655440000', name: 'laptop', timestamp: '2025-01-01T00:00:00.000Z', actor: null, description: null },
    ];
    const mockLogUseCase = { execute: mock.fn() };
    const mockListUseCase = {
      execute: mock.fn(async () => events),
    };
    const handler = new EventHandler(mockLogUseCase, mockListUseCase);
    const server = createTestServer(handler);

    await new Promise((r) => server.listen(0, r));
    try {
      const res = await getEvents(server, '/events?deviceId=550e8400-e29b-41d4-a716-446655440000');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body, JSON.stringify(events));
    } finally {
      server.close();
    }
  });

  it('GET returns 400 when deviceId query param is missing', async () => {
    const mockLogUseCase = { execute: mock.fn() };
    const mockListUseCase = { execute: mock.fn(), executeByType: mock.fn() };
    const handler = new EventHandler(mockLogUseCase, mockListUseCase);
    const server = createTestServer(handler);

    await new Promise((r) => server.listen(0, r));
    try {
      const res = await getEvents(server, '/events');

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body, JSON.stringify({ error: 'deviceId or type is required' }));
      assert.strictEqual(mockListUseCase.execute.mock.callCount(), 0);
    } finally {
      server.close();
    }
  });

  it('GET returns 400 when deviceId is not a valid UUID', async () => {
    const mockLogUseCase = { execute: mock.fn() };
    const mockListUseCase = {
      execute: mock.fn(async () => { throw new ValidationError('deviceId must be a valid UUID v4'); }),
    };
    const handler = new EventHandler(mockLogUseCase, mockListUseCase);
    const server = createTestServer(handler);

    await new Promise((r) => server.listen(0, r));
    try {
      const res = await getEvents(server, '/events?deviceId=not-a-uuid');

      assert.strictEqual(res.status, 400);
    } finally {
      server.close();
    }
  });

  it('GET returns 200 with empty array when no events exist', async () => {
    const mockLogUseCase = { execute: mock.fn() };
    const mockListUseCase = {
      execute: mock.fn(async () => []),
    };
    const handler = new EventHandler(mockLogUseCase, mockListUseCase);
    const server = createTestServer(handler);

    await new Promise((r) => server.listen(0, r));
    try {
      const res = await getEvents(server, '/events?deviceId=00000000-0000-0000-0000-000000000000');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body, '[]');
    } finally {
      server.close();
    }
  });

  // --- GET /events by type ---

  it('GET returns 200 with events for a valid type query', async () => {
    const events = [
      { id: '1', type: 'device.deleted', deviceId: '550e8400-e29b-41d4-a716-446655440000', name: 'laptop', timestamp: '2025-01-01T00:00:00.000Z', actor: 'admin', description: 'Removed' },
    ];
    const mockLogUseCase = { execute: mock.fn() };
    const mockListUseCase = {
      execute: mock.fn(),
      executeByType: mock.fn(async () => events),
    };
    const handler = new EventHandler(mockLogUseCase, mockListUseCase);
    const server = createTestServer(handler);

    await new Promise((r) => server.listen(0, r));
    try {
      const res = await getEvents(server, '/events?type=device.deleted');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body, JSON.stringify(events));
      assert.strictEqual(mockListUseCase.executeByType.mock.callCount(), 1);
      assert.strictEqual(
        mockListUseCase.executeByType.mock.calls[0].arguments[0],
        'device.deleted',
      );
    } finally {
      server.close();
    }
  });

  it('GET returns 200 with empty array when no events match type', async () => {
    const mockLogUseCase = { execute: mock.fn() };
    const mockListUseCase = {
      execute: mock.fn(),
      executeByType: mock.fn(async () => []),
    };
    const handler = new EventHandler(mockLogUseCase, mockListUseCase);
    const server = createTestServer(handler);

    await new Promise((r) => server.listen(0, r));
    try {
      const res = await getEvents(server, '/events?type=nonexistent');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body, '[]');
    } finally {
      server.close();
    }
  });

  it('GET returns 500 when executeByType throws unexpected error', async () => {
    const mockLogUseCase = { execute: mock.fn() };
    const mockListUseCase = {
      execute: mock.fn(),
      executeByType: mock.fn(async () => { throw new Error('DB exploded'); }),
    };
    const handler = new EventHandler(mockLogUseCase, mockListUseCase);
    const server = createTestServer(handler);

    await new Promise((r) => server.listen(0, r));
    try {
      const res = await getEvents(server, '/events?type=device.deleted');

      assert.strictEqual(res.status, 500);
    } finally {
      server.close();
    }
  });

  it('GET returns 500 when list use case throws unexpected error', async () => {
    const mockLogUseCase = { execute: mock.fn() };
    const mockListUseCase = {
      execute: mock.fn(async () => { throw new Error('DB exploded'); }),
    };
    const handler = new EventHandler(mockLogUseCase, mockListUseCase);
    const server = createTestServer(handler);

    await new Promise((r) => server.listen(0, r));
    try {
      const res = await getEvents(server, '/events?deviceId=550e8400-e29b-41d4-a716-446655440000');

      assert.strictEqual(res.status, 500);
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
