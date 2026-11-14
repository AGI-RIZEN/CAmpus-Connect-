import Redis from 'ioredis';
import { env } from './env';

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
  });

redis.on('error', (err) => {
  console.error('[redis] connection error:', err.message);
});

redis.on('connect', () => {
  console.log('[redis] connected');
});

if (env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}
