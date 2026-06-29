/**
 * In-memory metrics handler with request and error counters.
 *
 * Thread-safe not needed — Node.js is single-threaded for JS execution.
 */
export class MetricsHandler {
  constructor() {
    /** @type {number} */
    this.requests = 0;
    /** @type {number} */
    this.errors = 0;
    /** Ring buffer capacity. */
    this.cap = 200;
    /** @type {Array<{method: string, path: string, status: number, duration_ms: number, timestamp: string}>} */
    this.traces = new Array(this.cap);
    /** @type {number} */
    this.writeIdx = 0;
    /** @type {number} */
    this.count = 0;
  }

  /**
   * Push a request trace into the ring buffer.
   * Overwrites oldest entry when at capacity.
   *
   * @param {{method: string, path: string, status: number, durationMs: number, timestamp: string}} trace
   */
  pushTrace({ method, path, status, durationMs, timestamp }) {
    this.traces[this.writeIdx] = { method, path, status, duration_ms: durationMs, timestamp };
    this.writeIdx = (this.writeIdx + 1) % this.cap;
    this.count++;
  }

  /**
   * Retrieve up to `limit` traces, newest-first.
   *
   * @param {number} limit
   * @returns {Array<{method: string, path: string, status: number, duration_ms: number, timestamp: string}>}
   */
  getTraces(limit) {
    const stored = Math.min(this.count, this.cap);
    if (stored === 0) return [];
    const clamped = Math.max(1, Math.min(limit, this.cap));
    const resultSize = Math.min(clamped, stored);
    const result = new Array(resultSize);
    for (let i = 0; i < resultSize; i++) {
      const idx = (this.writeIdx - 1 - i + this.cap) % this.cap;
      result[i] = { ...this.traces[idx] };
    }
    return result;
  }

  /** Increment the total request counter. */
  incrementRequest() {
    this.requests++;
  }

  /** Increment the total error counter. */
  incrementError() {
    this.errors++;
  }

  /**
   * Parse limit from query string, clamped to [1, cap].
   *
   * @param {string} urlStr
   * @returns {number}
   */
  _parseLimit(urlStr) {
    const params = new URL(urlStr, 'http://localhost').searchParams;
    const raw = params.get('limit');
    const limit = raw !== null ? parseInt(raw, 10) : 50;
    if (Number.isNaN(limit) || limit < 1) return 1;
    return Math.min(limit, this.cap);
  }

  /**
   * Handle GET /metrics/requests — returns JSON with counters and recent traces.
   *
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   */
  handleRequests(req, res) {
    const limit = this._parseLimit(req.url);
    const traces = this.getTraces(limit);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        requests_total: this.requests,
        errors_total: this.errors,
        recent: traces,
      }) + '\n',
    );
  }

  /**
   * Handle GET /metrics — returns JSON with accumulated counters.
   *
   * @param {import('node:http').IncomingMessage} _req
   * @param {import('node:http').ServerResponse} res
   */
  handleMetrics(_req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        requests_total: this.requests,
        errors_total: this.errors,
      }) + '\n',
    );
  }
}
