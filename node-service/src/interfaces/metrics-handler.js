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
