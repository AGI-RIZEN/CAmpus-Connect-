import type { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

interface AccessTokenPayload {
  sub: string;
}

export function registerSocketHandlers(io: Server) {
  // Mirrors requireAuth's JWT check — a socket connection is just another authenticated
  // client, so it needs the same access token the REST API already trusts.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    console.log(`[socket] connected: ${socket.id} (user ${userId})`);

    socket.on('group:join', async (groupChatId: string) => {
      try {
        const chat = await prisma.groupChat.findUnique({ where: { id: groupChatId } });
        if (!chat) return;

        if (chat.isCommunity) {
          socket.join(`group:${groupChatId}`);
          return;
        }

        const membership = await prisma.groupMembership.findUnique({
          where: { userId_groupChatId: { userId, groupChatId } },
        });
        if (membership) socket.join(`group:${groupChatId}`);
      } catch (err) {
        console.error('[socket] group:join error (non-fatal):', (err as Error).message);
      }
    });

    socket.on('group:leave', (groupChatId: string) => {
      socket.leave(`group:${groupChatId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[socket] disconnected: ${socket.id} (${reason})`);
    });
  });
}
