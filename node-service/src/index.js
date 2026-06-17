import http from 'node:http';
import pino from 'pino';
import { MongoClient } from 'mongodb';
import { MongoEventRepository } from './infrastructure/mongo-event-repository.js';
import { LogEventUseCase } from './application/log-event.js';
import { ListEventsUseCase } from './application/list-events.js';
import { EventHandler } from './interfaces/event-handler.js';
import { HealthHandler } from './interfaces/health-handler.js';
import { createLoggingMiddleware } from './interfaces/middleware.js';
import { MetricsHandler } from './interfaces/metrics-handler.js';
import { KafkaEventConsumer } from './infrastructure/kafka-event-consumer.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const PORT = parseInt(process.env.PORT, 10) || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_DB = process.env.MONGO_DB || 'asset_tracker';
const KAFKA_BROKER = process.env.KAFKA_BROKER || '';
const KAFKA_TOPIC = process.env.KAFKA_TOPIC || 'device-events';
const KAFKA_CONSUMER_GROUP = process.env.KAFKA_CONSUMER_GROUP || 'asset-tracker-node';

async function main() {
  const mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();

  logger.info({ mongoUri: '***' }, 'connected to MongoDB');

  const eventRepository = new MongoEventRepository(mongoClient, MONGO_DB);
  const logEventUseCase = new LogEventUseCase(eventRepository);
  const listEventsUseCase = new ListEventsUseCase(eventRepository);
  const eventHandler = new EventHandler(logEventUseCase, listEventsUseCase);
  const healthHandler = new HealthHandler(mongoClient);
  const metricsHandler = new MetricsHandler();
  const loggingMiddleware = createLoggingMiddleware(logger);

  // --- Kafka consumer ---
  /** @type {KafkaEventConsumer | undefined} */
  let kafkaConsumer;

  if (KAFKA_BROKER) {
    try {
      const { KafkaJS } = await import('@confluentinc/kafka-javascript');
      const kafka = new KafkaJS.Kafka({
        'bootstrap.servers': KAFKA_BROKER,
        kafkaJS: { clientId: 'asset-tracker-node' },
      });
      kafkaConsumer = new KafkaEventConsumer({
        kafka,
        topic: KAFKA_TOPIC,
        groupId: KAFKA_CONSUMER_GROUP,
        logEventUseCase,
      });
      await kafkaConsumer.startConsuming();
    } catch (err) {
      logger.warn({ err }, 'failed to initialize kafka consumer — continuing without it');
    }
  } else {
    logger.warn('KAFKA_BROKER not set — kafka consumer disabled');
  }

  const server = http.createServer((req, res) => {
    metricsHandler.incrementRequest();

    res.on('finish', () => {
      if (res.statusCode >= 400) {
        metricsHandler.incrementError();
      }
    });

    loggingMiddleware(req, res, () => {
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
        healthHandler.handleHealth(req, res);
        return;
      }

      if (req.url === '/health/live' && req.method === 'GET') {
        healthHandler.handleLive(req, res);
        return;
      }

      if (req.url === '/health/ready' && req.method === 'GET') {
        healthHandler.handleReady(req, res);
        return;
      }

      if (req.url === '/metrics' && req.method === 'GET') {
        metricsHandler.handleMetrics(req, res);
        return;
      }

      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/events' && req.method === 'GET') {
        eventHandler.handleGet(req, res);
        return;
      }

      if (req.url === '/events' && req.method === 'POST') {
        eventHandler.handlePost(req, res);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
    });
  });

  server.listen(PORT, () => {
    logger.info({ port: PORT }, 'server started');
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('shutting down');
    server.close();
    if (kafkaConsumer) {
      await kafkaConsumer.stop();
    }
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
