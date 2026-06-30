import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { MetricsHandler } from './metrics-handler.js';

describe('MetricsHandler', () => {
  it('starts with zero counters', () => {
    const handler = new MetricsHandler();

    assert.strictEqual(handler.requests, 0);
    assert.strictEqual(handler.errors, 0);
  });

  it('returns JSON with initial zeros', () => {
    const handler = new MetricsHandler();
    const req = {};
    const res = { writeHead: mock.fn(), end: mock.fn() };

    handler.handleMetrics(req, res);

    assert.strictEqual(res.writeHead.mock.callCount(), 1);
    assert.strictEqual(res.writeHead.mock.calls[0].arguments[0], 200);
    assert.deepStrictEqual(res.writeHead.mock.calls[0].arguments[1], {
      'Content-Type': 'application/json',
    });

    const body = JSON.parse(res.end.mock.calls[0].arguments[0]);
    assert.strictEqual(body.requests_total, 0);
    assert.strictEqual(body.errors_total, 0);
  });

  it('increments request counter', () => {
    const handler = new MetricsHandler();

    handler.incrementRequest();
    handler.incrementRequest();
    handler.incrementRequest();

    assert.strictEqual(handler.requests, 3);
    assert.strictEqual(handler.errors, 0);
  });

  it('increments error counter', () => {
    const handler = new MetricsHandler();

    handler.incrementError();
    handler.incrementError();

    assert.strictEqual(handler.requests, 0);
    assert.strictEqual(handler.errors, 2);
  });

  it('returns JSON with accumulated counters after increments', () => {
    const handler = new MetricsHandler();

    handler.incrementRequest();
    handler.incrementRequest();
    handler.incrementError();
    handler.incrementRequest();
    handler.incrementError();

    const req = {};
    const res = { writeHead: mock.fn(), end: mock.fn() };

    handler.handleMetrics(req, res);

    const body = JSON.parse(res.end.mock.calls[0].arguments[0]);
    assert.strictEqual(body.requests_total, 3);
    assert.strictEqual(body.errors_total, 2);
  });

  it('sets Content-Type to application/json', () => {
    const handler = new MetricsHandler();
    const req = {};
    const res = { writeHead: mock.fn(), end: mock.fn() };

    handler.handleMetrics(req, res);

    assert.strictEqual(
      res.writeHead.mock.calls[0].arguments[1]['Content-Type'],
      'application/json',
    );
  });

  // --- handleRequests (T2.2) ---

  describe('handleRequests', () => {
    function setupHandler(traceCount = 60) {
      const handler = new MetricsHandler();
      for (let i = 0; i < traceCount; i++) {
        handler.pushTrace({
          method: 'GET',
          path: `/item/${i}`,
          status: 200,
          durationMs: i,
          timestamp: `t${i}`,
        });
      }
      return handler;
    }

    function mockReq(url = '/metrics/requests') {
      return { url };
    }

    function mockRes() {
      return { writeHead: mock.fn(), end: mock.fn() };
    }

    it('default limit of 50 with 60 traces returns 50 newest with correct counters', () => {
      const handler = setupHandler(60);
      handler.incrementRequest();
      handler.incrementRequest();
      handler.incrementError();
      const req = mockReq();
      const res = mockRes();

      handler.handleRequests(req, res);

      assert.strictEqual(res.writeHead.mock.calls[0].arguments[0], 200);
      const body = JSON.parse(res.end.mock.calls[0].arguments[0]);
      assert.strictEqual(body.requests_total, 2);
      assert.strictEqual(body.errors_total, 1);
      assert.strictEqual(body.recent.length, 50);
      assert.strictEqual(body.recent[0].path, '/item/59');
      assert.strictEqual(body.recent[49].path, '/item/10');
    });

    it('custom limit ?limit=10 returns 10 newest', () => {
      const handler = setupHandler(60);
      const req = mockReq('/metrics/requests?limit=10');
      const res = mockRes();

      handler.handleRequests(req, res);

      const body = JSON.parse(res.end.mock.calls[0].arguments[0]);
      assert.strictEqual(body.recent.length, 10);
      assert.strictEqual(body.recent[0].path, '/item/59');
      assert.strictEqual(body.recent[9].path, '/item/50');
    });

    it('returns all available traces when limit exceeds buffer size', () => {
      const handler = setupHandler(300);
      const req = mockReq('/metrics/requests?limit=500');
      const res = mockRes();

      handler.handleRequests(req, res);

      const body = JSON.parse(res.end.mock.calls[0].arguments[0]);
      assert.strictEqual(body.recent.length, 300);
    });

    it('limit=0 returns 1 trace (clamped to minimum 1)', () => {
      const handler = setupHandler(10);
      const req = mockReq('/metrics/requests?limit=0');
      const res = mockRes();

      handler.handleRequests(req, res);

      const body = JSON.parse(res.end.mock.calls[0].arguments[0]);
      assert.strictEqual(body.recent.length, 1);
    });

    it('empty buffer returns recent: [] with current counters', () => {
      const handler = new MetricsHandler();
      const req = mockReq();
      const res = mockRes();

      handler.handleRequests(req, res);

      const body = JSON.parse(res.end.mock.calls[0].arguments[0]);
      assert.strictEqual(body.requests_total, 0);
      assert.strictEqual(body.errors_total, 0);
      assert.deepStrictEqual(body.recent, []);
    });

    it('sets Content-Type to application/json', () => {
      const handler = new MetricsHandler();
      const req = mockReq();
      const res = mockRes();

      handler.handleRequests(req, res);

      assert.strictEqual(
        res.writeHead.mock.calls[0].arguments[1]['Content-Type'],
        'application/json',
      );
    });

    it('response shape includes requests_total, errors_total, recent', () => {
      const handler = setupHandler(5);
      const req = mockReq();
      const res = mockRes();

      handler.handleRequests(req, res);

      const body = JSON.parse(res.end.mock.calls[0].arguments[0]);
      assert.ok('requests_total' in body);
      assert.ok('errors_total' in body);
      assert.ok('recent' in body);
    });
  });

  // --- Server integration (T2.3) ---

  describe('server integration T2.3', () => {
    /**
     * Create a minimal HTTP server that mimics the index.js pattern:
     * incrementRequest on entry, pushTrace on finish, route dispatch.
     *
     * @param {MetricsHandler} handler
     * @returns {{ server: import('node:http').Server, port: number }}
     */
    async function createTestServer(handler) {
      const server = http.createServer((req, res) => {
        handler.incrementRequest();
        const start = Date.now();

        res.on('finish', () => {
          const durationMs = Date.now() - start;
          handler.pushTrace({
            method: req.method,
            path: new URL(req.url, 'http://localhost').pathname,
            status: res.statusCode,
            durationMs,
            timestamp: new Date().toISOString(),
          });

          if (res.statusCode >= 400) {
            handler.incrementError();
          }
        });

        const url = new URL(req.url, 'http://localhost');

        if (url.pathname === '/metrics/requests' && req.method === 'GET') {
          handler.handleRequests(req, res);
          return;
        }

        if (url.pathname === '/error') {
          res.writeHead(500);
          res.end('error');
          return;
        }

        res.writeHead(200);
        res.end('ok');
      });

      await new Promise(resolve => server.listen(0, resolve));
      const port = /** @type {import('net').AddressInfo} */ (server.address()).port;
      return { server, port };
    }

    /**
     * Make a GET request and return the parsed response.
     */
    function fetch(port, path) {
      return new Promise((resolve, reject) => {
        const req = http.request(
          `http://localhost:${port}${path}`,
          { method: 'GET' },
          (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
              resolve({ status: res.statusCode, headers: res.headers, body });
            });
          },
        );
        req.on('error', reject);
        req.end();
      });
    }

    it('captures trace on finish with correct fields after a request', async () => {
      const handler = new MetricsHandler();
      const { server, port } = await createTestServer(handler);

      try {
        await fetch(port, '/test-path');
        const traces = handler.getTraces(10);

        assert.strictEqual(traces.length, 1);
        assert.strictEqual(traces[0].method, 'GET');
        assert.strictEqual(traces[0].path, '/test-path');
        assert.strictEqual(traces[0].status, 200);
        assert.ok(traces[0].duration_ms > 0);
        assert.ok(traces[0].timestamp);
        assert.strictEqual(handler.requests, 1);
        assert.strictEqual(handler.errors, 0);
      } finally {
        server.close();
      }
    });

    it('captures 500 error status and increments error counter', async () => {
      const handler = new MetricsHandler();
      const { server, port } = await createTestServer(handler);

      try {
        const res = await fetch(port, '/error');

        assert.strictEqual(res.status, 500);
        assert.strictEqual(handler.requests, 1);
        assert.strictEqual(handler.errors, 1);

        const traces = handler.getTraces(10);
        assert.strictEqual(traces.length, 1);
        assert.strictEqual(traces[0].status, 500);
      } finally {
        server.close();
      }
    });

    it('GET /metrics/requests returns valid JSON with trace data', async () => {
      const handler = new MetricsHandler();
      const { server, port } = await createTestServer(handler);

      try {
        // Make a regular request first so a trace exists
        await fetch(port, '/some-path');
        // Now hit the metrics detail endpoint
        const res = await fetch(port, '/metrics/requests?limit=5');

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.headers['content-type'], 'application/json');

        const body = JSON.parse(res.body);
        assert.ok('requests_total' in body);
        assert.ok('errors_total' in body);
        assert.ok('recent' in body);
        assert.strictEqual(body.recent.length, 1);
        assert.strictEqual(body.recent[0].method, 'GET');
        assert.strictEqual(body.recent[0].path, '/some-path');
      } finally {
        server.close();
      }
    });
  });

  // --- Trace storage (T2.1) ---

  describe('trace storage', () => {
    it('pushTrace appends when buffer below capacity', () => {
      const handler = new MetricsHandler();
      handler.pushTrace({ method: 'GET', path: '/a', status: 200, durationMs: 10, timestamp: 't1' });
      handler.pushTrace({ method: 'POST', path: '/b', status: 201, durationMs: 20, timestamp: 't2' });
      handler.pushTrace({ method: 'DELETE', path: '/c', status: 204, durationMs: 5, timestamp: 't3' });

      const traces = handler.getTraces(200);
      assert.strictEqual(traces.length, 3);
      assert.strictEqual(traces[0].method, 'DELETE');
      assert.strictEqual(traces[0].path, '/c');
      assert.strictEqual(traces[0].status, 204);
      assert.strictEqual(traces[0].duration_ms, 5);
      assert.strictEqual(traces[0].timestamp, 't3');
      assert.strictEqual(traces[2].method, 'GET');
    });

    it('pushTrace appends without overwriting when buffer exceeds previous cap 200', () => {
      const handler = new MetricsHandler();
      // Fill the buffer
      for (let i = 0; i < 200; i++) {
        handler.pushTrace({ method: 'GET', path: `/item/${i}`, status: 200, durationMs: i, timestamp: `t${i}` });
      }
      // Last pushed should be newest
      assert.strictEqual(handler.getTraces(1)[0].path, '/item/199');

      // Push one more — should NOT overwrite, all 201 should exist
      handler.pushTrace({ method: 'POST', path: '/new', status: 201, durationMs: 99, timestamp: 't200' });

      const traces = handler.getTraces(300);
      assert.strictEqual(traces.length, 201);
      // /new is newest; /item/0 is still oldest
      assert.strictEqual(traces[0].path, '/new');
      assert.strictEqual(traces[200].path, '/item/0');
    });

    it('getTraces returns empty array when buffer has zero entries', () => {
      const handler = new MetricsHandler();
      const traces = handler.getTraces(10);
      assert.deepStrictEqual(traces, []);
    });

    it('getTraces(limit) returns at most limit entries, newest-first', () => {
      const handler = new MetricsHandler();
      for (let i = 0; i < 10; i++) {
        handler.pushTrace({ method: 'GET', path: `/item/${i}`, status: 200, durationMs: i, timestamp: `t${i}` });
      }

      const traces = handler.getTraces(3);
      assert.strictEqual(traces.length, 3);
      assert.strictEqual(traces[0].path, '/item/9');
      assert.strictEqual(traces[1].path, '/item/8');
      assert.strictEqual(traces[2].path, '/item/7');
    });

    it('pushTrace fields preserved correctly', () => {
      const handler = new MetricsHandler();
      const now = new Date().toISOString();
      handler.pushTrace({ method: 'PATCH', path: '/widgets/42', status: 200, durationMs: 15.5, timestamp: now });

      const traces = handler.getTraces(1);
      assert.strictEqual(traces.length, 1);
      assert.strictEqual(traces[0].method, 'PATCH');
      assert.strictEqual(traces[0].path, '/widgets/42');
      assert.strictEqual(traces[0].status, 200);
      assert.strictEqual(traces[0].duration_ms, 15.5);
      assert.strictEqual(traces[0].timestamp, now);
    });
  });
});
