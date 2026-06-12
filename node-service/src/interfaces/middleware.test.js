import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';
import { createLoggingMiddleware } from './middleware.js';

describe('loggingMiddleware', () => {
  it('calls the next function', () => {
    const mockLogger = { info: mock.fn() };
    const middleware = createLoggingMiddleware(mockLogger);
    const req = { method: 'GET', url: '/test' };
    const res = new EventEmitter();
    res.statusCode = 200;
    const next = mock.fn();

    middleware(req, res, next);

    assert.strictEqual(next.mock.callCount(), 1);
  });

  it('logs correct fields on response finish', () => {
    const mockLogger = { info: mock.fn() };
    const middleware = createLoggingMiddleware(mockLogger);
    const req = { method: 'POST', url: '/events' };
    const res = new EventEmitter();
    res.statusCode = 201;
    const next = mock.fn();

    middleware(req, res, next);
    res.emit('finish');

    assert.strictEqual(mockLogger.info.mock.callCount(), 1);
    const args = mockLogger.info.mock.calls[0].arguments;
    assert.strictEqual(args[0].method, 'POST');
    assert.strictEqual(args[0].url, '/events');
    assert.strictEqual(args[0].statusCode, 201);
    assert.ok(typeof args[0].duration_ms === 'number');
    assert.strictEqual(args[1], 'request completed');
  });

  it('computes a non-negative duration', () => {
    const mockLogger = { info: mock.fn() };
    const middleware = createLoggingMiddleware(mockLogger);
    const req = { method: 'GET', url: '/test' };
    const res = new EventEmitter();
    res.statusCode = 200;
    const next = mock.fn();

    middleware(req, res, next);
    res.emit('finish');

    const { duration_ms } = mockLogger.info.mock.calls[0].arguments[0];
    assert.ok(typeof duration_ms === 'number');
    assert.ok(duration_ms >= 0, `expected duration_ms >= 0, got ${duration_ms}`);
  });

  it('next is called synchronously before finish', () => {
    const mockLogger = { info: mock.fn() };
    const middleware = createLoggingMiddleware(mockLogger);
    const req = { method: 'GET', url: '/test' };
    const res = new EventEmitter();
    res.statusCode = 200;
    let nextCalled = false;

    middleware(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
    // Logger should NOT have been called yet (finish not emitted)
    assert.strictEqual(mockLogger.info.mock.callCount(), 0);
  });
});
