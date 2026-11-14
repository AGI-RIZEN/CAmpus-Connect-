import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { redis } from './config/redis';
import { registerSocketHandlers } from './sockets';
import { setIO } from './sockets/emitter';

async function main() {
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: { origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',') },
  });

  // maxRetriesPerRequest: null — the pub/sub clients hold a long-lived SUBSCRIBE, so they must
  // retry forever instead of rejecting queued commands after a few attempts (ioredis's own
  // recommendation for adapter/subscriber clients; without this, Redis being briefly unreachable
  // crashes the process via an unhandled rejection instead of just reconnecting).
  const pubClient = redis.duplicate({ maxRetriesPerRequest: null });
  const subClient = redis.duplicate({ maxRetriesPerRequest: null });
  pubClient.on('error', (err) => console.error('[redis:pub] connection error:', err.message));
  subClient.on('error', (err) => console.error('[redis:sub] connection error:', err.message));
  io.adapter(createAdapter(pubClient, subClient));

  setIO(io);
  registerSocketHandlers(io);

  httpServer.listen(env.PORT, () => {
    console.log(`Campus Connect API listening on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });

  async function shutdown(signal: string) {
    console.log(`Received ${signal}, shutting down...`);
    httpServer.close();
    await Promise.all([prisma.$disconnect(), pubClient.quit(), subClient.quit(), redis.quit()]);
    process.exit(0);
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandled rejection]', reason);
});
