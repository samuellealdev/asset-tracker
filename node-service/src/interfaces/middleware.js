/**
 * Creates a logging middleware function.
 *
 * The returned middleware intercepts every HTTP request, records the start
 * time, passes control to the next handler, and logs method / url / statusCode
 * / duration_ms on the response `finish` event.
 *
 * @param {import('pino').Logger} logger - A pino logger instance
 * @returns {(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: () => void) => void}
 */
export function createLoggingMiddleware(logger) {
  /**
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   * @param {() => void} next - Next handler in the chain
   */
  return function loggingMiddleware(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
      logger.info(
        {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration_ms: Date.now() - start,
        },
        'request completed',
      );
    });

    next();
  };
}
