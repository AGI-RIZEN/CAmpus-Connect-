import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = basePrisma;
}

/**
 * Neon's free-tier compute auto-suspends after a few minutes of inactivity. Two different
 * failure shapes show up depending on how cold it is:
 *  - "Server has closed the connection" — a connection Prisma's pool thought was alive had
 *    already been dropped server-side. A same-instant retry fixes this.
 *  - "Can't reach database server" — the compute is fully suspended and hasn't woken up at all
 *    yet. An immediate retry usually still fails; Neon's cold start genuinely takes a few
 *    seconds, so this one needs a short delay before retrying (confirmed empirically: an
 *    instant retry failed, a retry ~5s later succeeded).
 * Both are infrastructure hiccups, not real failures — without this, every feature in the app
 * (not just one) randomly 500s the first time it's used after the app sits idle for a while.
 */
function isDroppedConnectionError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /server has closed the connection|connection.*(closed|reset|terminated)|ECONNRESET/i.test(message);
}

function isColdStartError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /can't reach database server|connect econnrefused|timeout.*connect|connection.*timed out/i.test(message);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const COLD_START_RETRY_DELAYS_MS = [1500, 3000, 4000]; // ~8.5s total, covers Neon's typical wake-up time

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (err) {
          if (isDroppedConnectionError(err)) {
            return await query(args);
          }
          if (isColdStartError(err)) {
            for (const delay of COLD_START_RETRY_DELAYS_MS) {
              await sleep(delay);
              try {
                return await query(args);
              } catch (retryErr) {
                if (!isColdStartError(retryErr)) throw retryErr;
              }
            }
          }
          throw err;
        }
      },
    },
  },
});
