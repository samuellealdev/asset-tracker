import pino from 'pino';
import { ValidationError } from '../domain/event.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

/**
 * HTTP handler for event-related endpoints.
 * Receives use cases via constructor (manual DI).
 */
export class EventHandler {
  /**
   * @param {import('../application/log-event.js').LogEventUseCase} logEventUseCase
   * @param {import('../application/list-events.js').ListEventsUseCase} listEventsUseCase
   */
  constructor(logEventUseCase, listEventsUseCase) {
    /** @private */
    this.logEventUseCase = logEventUseCase;
    /** @private */
    this.listEventsUseCase = listEventsUseCase;
  }

  /**
   * Handle POST /events — parse JSON body, delegate to use case, respond.
   *
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   */
  async handlePost(req, res) {
    logger.info({ method: req.method, url: req.url }, 'request start');

    let body;
    try {
      body = await parseBody(req);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid JSON body' }));
      return;
    }

    try {
      const event = await this.logEventUseCase.execute(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(event));
      logger.info({ eventId: event.id }, 'event created');
    } catch (err) {
      if (err instanceof ValidationError) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }

      logger.error({ err }, 'unexpected error handling POST /events');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'internal server error' }));
    }
  }

  /**
   * Handle GET /events — query events by deviceId.
   *
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   */
  async handleGet(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const deviceId = url.searchParams.get('deviceId');

    if (!deviceId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'deviceId is required' }));
      return;
    }

    try {
      const events = await this.listEventsUseCase.execute(deviceId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(events));
    } catch (err) {
      if (err instanceof ValidationError) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }

      logger.error({ err }, 'unexpected error handling GET /events');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'internal server error' }));
    }
  }
}

/**
 * Accumulate request body chunks and parse as JSON.
 *
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<Object>}
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}
