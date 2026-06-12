import http from 'node:http';
import pino from 'pino';
import { MongoClient } from 'mongodb';
import { MongoEventRepository } from './infrastructure/mongo-event-repository.js';
import { LogEventUseCase } from './application/log-event.js';
import { EventHandler } from './interfaces/event-handler.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const PORT = parseInt(process.env.PORT, 10) || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_DB = process.env.MONGO_DB || 'asset_tracker';

async function main() {
  const mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();

  logger.info({ mongoUri: '***' }, 'connected to MongoDB');

  const eventRepository = new MongoEventRepository(mongoClient, MONGO_DB);
  const logEventUseCase = new LogEventUseCase(eventRepository);
  const eventHandler = new EventHandler(logEventUseCase);

  const server = http.createServer((req, res) => {
    // CORS headers for development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, OPTIONS',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type',
    );

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }) + '\n');
      return;
    }

    if (req.url === '/events' && req.method === 'POST') {
      eventHandler.handlePost(req, res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  });

  server.listen(PORT, () => {
    logger.info({ port: PORT }, 'server started');
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('shutting down');
    server.close();
    await mongoClient.close();
    logger.info('shutdown complete');
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  logger.error({ err }, 'failed to start server');
  process.exit(1);
});
