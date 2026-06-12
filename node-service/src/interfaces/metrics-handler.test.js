import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
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
});
